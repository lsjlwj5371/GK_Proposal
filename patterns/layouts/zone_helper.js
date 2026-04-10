/**
 * ═══════════════════════════════════════════════════════════════
 *  zone_helper.js — Content Box 영역 분할 유틸리티
 * ═══════════════════════════════════════════════════════════════
 *
 *  목적:
 *   한 페이지 = 한 패턴(1:1) 구조를 깨고, Content Box를 여러 zone으로
 *   쪼개 서로 다른 컴포넌트가 공존할 수 있게 한다.
 *
 *  하위 호환:
 *   기존 컴포넌트는 zone을 받지 않으면 CB 전체를 사용하도록 한다.
 *   컴포넌트 내부에서 `const z = zone || CB_FULL;`
 *
 *  사용법:
 *   const { split, DENSITY, CB_FULL } = require('./zone_helper');
 *   const [top, bottom] = split.TB(0.30);  // 상 30% / 하 70%
 *   cardGrid(sl, pptx, { zone: top, cards, density: 'strip' });
 */

// ── Content Box 기본 상수 (컴포넌트와 동일하게 유지) ──────────────────
const CB_X = 0.53;
const CB_Y = 1.77;
const CB_W = 10.63;
const CB_H = 5.91;
const CB_GAP = 0.20; // zone 간 최소 gap (AP-16')

const CB_FULL = Object.freeze({ x: CB_X, y: CB_Y, w: CB_W, h: CB_H });

// ── Density 테이블 ────────────────────────────────────────────────────
// zone 크기에 따라 폰트/패딩/최소 카드 높이를 강제하여 가독성 floor 보장.
// zone 높이가 임계 이하이면 throw → 8pt 같은 폰트가 찍히는 일 방지.
const DENSITY = Object.freeze({
  full: {
    titleFs: 18, bodyFs: 13, numFs: 48, labelFs: 11,
    pad: 0.20, gap: 0.15,
    minCardH: 2.40, minZoneH: 3.50,
  },
  half: {
    titleFs: 16, bodyFs: 12, numFs: 40, labelFs: 10,
    pad: 0.15, gap: 0.12,
    minCardH: 1.90, minZoneH: 2.40,
  },
  third: {
    titleFs: 14, bodyFs: 11, numFs: 32, labelFs: 10,
    pad: 0.12, gap: 0.10,
    minCardH: 1.50, minZoneH: 1.80,
  },
  quarter: {
    titleFs: 13, bodyFs: 10, numFs: 28, labelFs: 9,
    pad: 0.10, gap: 0.08,
    minCardH: 1.30, minZoneH: 1.40,
  },
  strip: {
    titleFs: 12, bodyFs: 10, numFs: 24, labelFs: 9,
    pad: 0.08, gap: 0.08,
    minCardH: 0.90, minZoneH: 0.80,
  },
});

/**
 * zone 크기로부터 자동으로 density 키를 추론한다.
 * 기본 규칙: zone 높이 비율 기반.
 */
function inferDensity(zone) {
  const ratio = zone.h / CB_H;
  if (ratio >= 0.85) return 'full';
  if (ratio >= 0.55) return 'half';
  if (ratio >= 0.38) return 'third';
  if (ratio >= 0.22) return 'quarter';
  return 'strip';
}

/**
 * zone이 density 기준 minZoneH를 만족하는지 검증.
 * 미달 시 throw — 너무 작은 zone에 콘텐츠를 밀어넣는 것을 원천 차단.
 */
function assertZoneSize(zone, densityKey) {
  const d = DENSITY[densityKey];
  if (!d) throw new Error(`unknown density: ${densityKey}`);
  if (zone.h < d.minZoneH) {
    throw new Error(
      `zone height ${zone.h.toFixed(2)}" too small for density "${densityKey}" ` +
      `(min ${d.minZoneH}"). 더 큰 zone을 할당하거나 density를 낮추세요.`
    );
  }
}

// ── Split 함수들 ──────────────────────────────────────────────────────
// 모든 split은 CB_GAP만큼 zone 사이를 벌린다.

/**
 * Top-Bottom 2분할
 * @param {number} topRatio - 0~1 사이. 상단 zone의 높이 비율 (gap 포함 전)
 * @returns {[zone, zone]} [top, bottom]
 */
function splitTB(topRatio = 0.5) {
  const usableH = CB_H - CB_GAP;
  const topH = usableH * topRatio;
  const botH = usableH * (1 - topRatio);
  return [
    { x: CB_X, y: CB_Y, w: CB_W, h: topH },
    { x: CB_X, y: CB_Y + topH + CB_GAP, w: CB_W, h: botH },
  ];
}

/**
 * Left-Right 2분할
 * @param {number} leftRatio - 0~1. 좌측 zone의 폭 비율
 */
function splitLR(leftRatio = 0.5) {
  const usableW = CB_W - CB_GAP;
  const leftW = usableW * leftRatio;
  const rightW = usableW * (1 - leftRatio);
  return [
    { x: CB_X, y: CB_Y, w: leftW, h: CB_H },
    { x: CB_X + leftW + CB_GAP, y: CB_Y, w: rightW, h: CB_H },
  ];
}

/**
 * 3단 T-M-B 분할 (상단 히어로 + 중단 메인 + 하단 인사이트)
 * @param {number[]} ratios - 길이 3, 합 1. 기본 [0.20, 0.62, 0.18]
 */
function splitTMB(ratios = [0.20, 0.62, 0.18]) {
  if (ratios.length !== 3) throw new Error('splitTMB: ratios must have length 3');
  const usableH = CB_H - CB_GAP * 2;
  const hs = ratios.map(r => usableH * r);
  const zones = [];
  let y = CB_Y;
  for (let i = 0; i < 3; i++) {
    zones.push({ x: CB_X, y, w: CB_W, h: hs[i] });
    y += hs[i] + CB_GAP;
  }
  return zones;
}

/**
 * 2x2 그리드 분할
 */
function split2x2() {
  const usableW = CB_W - CB_GAP;
  const usableH = CB_H - CB_GAP;
  const w = usableW / 2;
  const h = usableH / 2;
  return [
    { x: CB_X,               y: CB_Y,               w, h }, // TL
    { x: CB_X + w + CB_GAP,  y: CB_Y,               w, h }, // TR
    { x: CB_X,               y: CB_Y + h + CB_GAP,  w, h }, // BL
    { x: CB_X + w + CB_GAP,  y: CB_Y + h + CB_GAP,  w, h }, // BR
  ];
}

/**
 * Main + Aside (메인 좌측 + 사이드 우측, 또는 반대)
 * @param {number} mainRatio - 메인 zone의 폭 비율 (기본 0.68)
 * @param {'left'|'right'} mainSide - 메인 zone 위치
 */
function splitMainAside(mainRatio = 0.68, mainSide = 'left') {
  const usableW = CB_W - CB_GAP;
  const mainW = usableW * mainRatio;
  const asideW = usableW * (1 - mainRatio);
  if (mainSide === 'left') {
    return [
      { x: CB_X, y: CB_Y, w: mainW, h: CB_H },                        // main
      { x: CB_X + mainW + CB_GAP, y: CB_Y, w: asideW, h: CB_H },      // aside
    ];
  }
  return [
    { x: CB_X + asideW + CB_GAP, y: CB_Y, w: mainW, h: CB_H },        // main
    { x: CB_X, y: CB_Y, w: asideW, h: CB_H },                         // aside
  ];
}

/**
 * zone 내부에서 다시 분할 (zone-local split)
 * split.TB 등과 동일하지만 CB가 아닌 임의 zone 기준.
 */
function subSplitTB(zone, topRatio = 0.5, gap = CB_GAP) {
  const usableH = zone.h - gap;
  const topH = usableH * topRatio;
  const botH = usableH * (1 - topRatio);
  return [
    { x: zone.x, y: zone.y, w: zone.w, h: topH },
    { x: zone.x, y: zone.y + topH + gap, w: zone.w, h: botH },
  ];
}

function subSplitLR(zone, leftRatio = 0.5, gap = CB_GAP) {
  const usableW = zone.w - gap;
  const leftW = usableW * leftRatio;
  const rightW = usableW * (1 - leftRatio);
  return [
    { x: zone.x, y: zone.y, w: leftW, h: zone.h },
    { x: zone.x + leftW + gap, y: zone.y, w: rightW, h: zone.h },
  ];
}

function subSplitCols(zone, n, gap = CB_GAP) {
  const usableW = zone.w - gap * (n - 1);
  const w = usableW / n;
  const zones = [];
  for (let i = 0; i < n; i++) {
    zones.push({ x: zone.x + i * (w + gap), y: zone.y, w, h: zone.h });
  }
  return zones;
}

function subSplitRows(zone, n, gap = CB_GAP) {
  const usableH = zone.h - gap * (n - 1);
  const h = usableH / n;
  const zones = [];
  for (let i = 0; i < n; i++) {
    zones.push({ x: zone.x, y: zone.y + i * (h + gap), w: zone.w, h });
  }
  return zones;
}

const split = Object.freeze({
  TB: splitTB,
  LR: splitLR,
  TMB: splitTMB,
  grid2x2: split2x2,
  mainAside: splitMainAside,
});

const sub = Object.freeze({
  TB: subSplitTB,
  LR: subSplitLR,
  cols: subSplitCols,
  rows: subSplitRows,
});

module.exports = {
  CB_X, CB_Y, CB_W, CB_H, CB_GAP, CB_FULL,
  DENSITY,
  inferDensity,
  assertZoneSize,
  split,
  sub,
};
