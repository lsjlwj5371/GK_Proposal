/**
 * ═══════════════════════════════════════════════════════════════
 *  card_grid.js — 적응형 카드 그리드 컴포넌트
 * ═══════════════════════════════════════════════════════════════
 *
 *  Good Example 분석 기반 핵심 디자인 토큰:
 *   - 카드 내부 패딩: 0.15~0.2" (촘촘하게)
 *   - 카드 간격: 0.08~0.12" (좁게)
 *   - 어두운 배경 카드 적극 활용
 *   - 상단 액센트 바 (0.05" 높이)
 *   - 큰 숫자 (36~48pt) 시각적 앵커
 *   - 둥근 모서리 + 그림자
 *   - 콘텐츠 영역 활용률 85~92%
 *
 *  사용법:
 *   const cardGrid = require('./card_grid');
 *   cardGrid(sl, pptx, { cards, palette, style: 'dark' });
 */

// Content Box 상수 (기본 zone)
const CB_X = 0.53;
const CB_Y = 1.77;
const CB_W = 10.63;
const CB_H = 5.91;
const CB_PAD = 0.15;
const CB_GAP_DEFAULT = 0.10; // 카드 간격 (좁게)

// zone 기반 레이아웃 지원 (Option B)
const { DENSITY, inferDensity, assertZoneSize } = require('../layouts/zone_helper');

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN_TN = 'Pretendard Thin';

/**
 * 카드 수에 따라 최적 그리드 자동 결정
 */
function resolveGrid(n) {
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n === 2) return { cols: 2, rows: 1 };
  if (n === 3) return { cols: 3, rows: 1 };
  if (n === 4) return { cols: 2, rows: 2 };
  if (n <= 6) return { cols: 3, rows: 2 };
  return { cols: 4, rows: 2 }; // 7-8개
}

/**
 * 텍스트 길이에 따라 폰트 크기 자동 조절
 */
function adaptFontSize(text, baseSize, minSize) {
  if (!text) return baseSize;
  const len = text.length;
  if (len > 150) return Math.max(minSize, baseSize - 3);
  if (len > 100) return Math.max(minSize, baseSize - 2);
  if (len > 60) return Math.max(minSize, baseSize - 1);
  return baseSize;
}

/**
 * 기본 스타일 카드 렌더링
 * 밝은 배경, 어두운 텍스트, 상단 액센트 바
 */
function renderDefaultCard(sl, pptx, { x, y, w, h, card, palette, iconSize }) {
  const PAD = 0.18;
  const titleSize = adaptFontSize(card.title, 18, 14);
  const bodySize = adaptFontSize(card.body, 13, 11);

  // 카드 배경 (둥근 모서리 + 그림자)
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.12,
    fill: { color: palette.CD || 'F0F2F5' },
    shadow: { type: 'outer', color: '000000', blur: 8, offset: 2, angle: 315, opacity: 0.15 },
  });

  // 상단 액센트 바
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: x + 0.01, y: y + 0.01, w: w - 0.02, h: 0.05,
    fill: { color: palette.ACC || '3366CC' },
    rectRadius: 0.03,
  });

  let contentY = y + 0.25;

  // 아이콘 영역 (있을 경우)
  if (card.icon) {
    sl.addText(card.icon, {
      x: x + PAD, y: contentY, w: 0.6, h: 0.6,
      fontSize: iconSize || 28, align: 'center', valign: 'middle',
    });
    contentY += 0.65;
  }

  // 타이틀
  sl.addText(card.title || '', {
    x: x + PAD, y: contentY, w: w - PAD * 2, h: 0.5,
    fontSize: titleSize, fontFace: FN_XB, color: palette.TD || '1A1A2E',
    valign: 'top', wrap: true,
  });
  contentY += 0.55;

  // 구분선 (얇은 컬러 라인)
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: x + PAD, y: contentY, w: 1.2, h: 0.03,
    fill: { color: palette.ACC || '3366CC' },
  });
  contentY += 0.18;

  // 본문
  if (card.body) {
    sl.addText(card.body, {
      x: x + PAD, y: contentY, w: w - PAD * 2, h: h - (contentY - y) - PAD,
      fontSize: bodySize, fontFace: FN_MD, color: palette.TG || '6B7280',
      valign: 'top', wrap: true, lineSpacingMultiple: 1.4,
    });
  }
}

/**
 * 다크 스타일 카드 렌더링
 * 어두운 배경, 밝은 텍스트 — 시각적 무게감 확보
 */
function renderDarkCard(sl, pptx, { x, y, w, h, card, palette, iconSize }) {
  const PAD = 0.18;
  const titleSize = adaptFontSize(card.title, 18, 14);
  const bodySize = adaptFontSize(card.body, 13, 11);

  // 카드 배경 (어두운 색상)
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.12,
    fill: { color: palette.DOM || '1B2A4A' },
    shadow: { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 315, opacity: 0.25 },
  });

  // 상단 액센트 바
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: x + 0.01, y: y + 0.01, w: w - 0.02, h: 0.05,
    fill: { color: palette.ACC || '00E5FF' },
    rectRadius: 0.03,
  });

  let contentY = y + 0.25;

  // 아이콘 (밝은 배경 원형 위)
  if (card.icon) {
    sl.addShape(pptx.shapes.OVAL, {
      x: x + PAD, y: contentY, w: 0.55, h: 0.55,
      fill: { color: palette.ACC || '00E5FF', transparency: 80 },
    });
    sl.addText(card.icon, {
      x: x + PAD, y: contentY, w: 0.55, h: 0.55,
      fontSize: iconSize || 24, align: 'center', valign: 'middle',
    });
    contentY += 0.65;
  }

  // 타이틀
  sl.addText(card.title || '', {
    x: x + PAD, y: contentY, w: w - PAD * 2, h: 0.5,
    fontSize: titleSize, fontFace: FN_XB, color: palette.W || 'FFFFFF',
    valign: 'top', wrap: true,
  });
  contentY += 0.55;

  // 구분선
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: x + PAD, y: contentY, w: 1.2, h: 0.03,
    fill: { color: palette.ACC || '00E5FF', transparency: 40 },
  });
  contentY += 0.18;

  // 본문
  if (card.body) {
    sl.addText(card.body, {
      x: x + PAD, y: contentY, w: w - PAD * 2, h: h - (contentY - y) - PAD,
      fontSize: bodySize, fontFace: FN_MD, color: 'CCCCCC',
      valign: 'top', wrap: true, lineSpacingMultiple: 1.4,
    });
  }
}

/**
 * KPI 스타일 카드 렌더링
 * 큰 숫자가 시각적 앵커, 밀도감 최대
 */
function renderKpiCard(sl, pptx, { x, y, w, h, card, palette }) {
  const PAD = 0.18;
  const numberSize = card.number && card.number.length > 5 ? 32 : 42;

  // 카드 배경
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.12,
    fill: { color: palette.DK || '0A0A1E' },
    shadow: { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 315, opacity: 0.3 },
  });

  // 상단 액센트 바
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: x + 0.01, y: y + 0.01, w: w - 0.02, h: 0.05,
    fill: { color: palette.ACC || '00E5FF' },
    rectRadius: 0.03,
  });

  let contentY = y + 0.3;

  // 아이콘 (있을 경우)
  if (card.icon) {
    sl.addShape(pptx.shapes.OVAL, {
      x: x + PAD, y: contentY, w: 0.5, h: 0.5,
      fill: { color: palette.SEC || '6C3AE0', transparency: 60 },
    });
    sl.addText(card.icon, {
      x: x + PAD, y: contentY, w: 0.5, h: 0.5,
      fontSize: 22, align: 'center', valign: 'middle',
    });
    contentY += 0.6;
  }

  // 큰 숫자 (시각적 앵커)
  if (card.number) {
    sl.addText(card.number, {
      x: x + PAD, y: contentY, w: w - PAD * 2, h: 0.7,
      fontSize: numberSize, fontFace: FN_XB, color: palette.ACC || '00E5FF',
      valign: 'middle',
    });
    contentY += 0.75;
  }

  // 타이틀
  sl.addText(card.title || '', {
    x: x + PAD, y: contentY, w: w - PAD * 2, h: 0.4,
    fontSize: 15, fontFace: FN_XB, color: palette.W || 'FFFFFF',
    valign: 'top', wrap: true,
  });
  contentY += 0.45;

  // 본문
  if (card.body) {
    sl.addText(card.body, {
      x: x + PAD, y: contentY, w: w - PAD * 2, h: h - (contentY - y) - PAD,
      fontSize: 11, fontFace: FN_MD, color: 'AAAAAA',
      valign: 'top', wrap: true, lineSpacingMultiple: 1.3,
    });
  }
}

/**
 * 이미지 오버레이 스타일 카드
 * 배경 이미지 + 그라데이션 오버레이 + 텍스트
 */
function renderImageOverlayCard(sl, pptx, { x, y, w, h, card, palette }) {
  const PAD = 0.18;

  // 이미지 플레이스홀더 배경
  // [IMAGE: card.image 또는 관련 이미지]
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.12,
    fill: { color: palette.LT || 'E8E8F0' },
  });

  // 이미지 영역 표시
  sl.addText('📷 이미지 영역', {
    x, y: y + 0.3, w, h: 0.3,
    fontSize: 9, color: palette.TG || '999999', align: 'center',
  });

  // 그라데이션 오버레이 (하단→상단, 불투명→투명)
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.12,
    fill: {
      type: 'gradient',
      stops: [
        { position: 0, color: '000000', transparency: 90 },
        { position: 50, color: '000000', transparency: 50 },
        { position: 100, color: '000000', transparency: 10 },
      ],
      direction: 'down',
    },
  });

  // 하단에 텍스트 (오버레이의 불투명 부분)
  const textY = y + h - 1.3;

  sl.addText(card.title || '', {
    x: x + PAD, y: textY, w: w - PAD * 2, h: 0.45,
    fontSize: 17, fontFace: FN_XB, color: 'FFFFFF',
    valign: 'bottom', wrap: true,
  });

  sl.addShape(pptx.shapes.RECTANGLE, {
    x: x + PAD, y: textY + 0.5, w: 1.0, h: 0.03,
    fill: { color: palette.ACC || '00E5FF' },
  });

  if (card.body) {
    sl.addText(card.body, {
      x: x + PAD, y: textY + 0.6, w: w - PAD * 2, h: 0.6,
      fontSize: 11, fontFace: FN_MD, color: 'DDDDDD',
      valign: 'top', wrap: true, lineSpacingMultiple: 1.3,
    });
  }
}

/**
 * 메인 함수: 적응형 카드 그리드
 *
 * @param {Object} sl - pptxgenjs 슬라이드 객체
 * @param {Object} pptx - pptxgenjs 인스턴스
 * @param {Object} options
 * @param {Array} options.cards - 카드 데이터 배열
 *   [{ title, body, icon?, number?, image? }]
 * @param {Object} options.palette - 색상 팔레트
 * @param {string} [options.style='default'] - 'default'|'dark'|'kpi'|'image-overlay'
 * @param {number} [options.iconSize=28] - 아이콘 크기 (pt)
 * @param {Object} [options.gridOverride] - { cols, rows } 수동 지정
 * @param {Object} [options.zone] - (Option B) { x, y, w, h } 렌더링 영역.
 *   생략 시 Content Box 전체(CB_FULL)를 사용 → 하위 호환.
 * @param {string} [options.density] - (Option B) 'full'|'half'|'third'|'quarter'|'strip'.
 *   생략 시 zone 크기로 자동 추론. zone이 density의 최소 높이를 못 채우면 throw.
 * @param {number} [options.gap] - (Option B) 카드 간 gap override. 생략 시 density.gap 사용.
 */
function cardGrid(sl, pptx, options = {}) {
  const {
    cards = [],
    palette = {},
    style = 'default',
    iconSize = 28,
    gridOverride,
    zone,
    density: densityKey,
    gap: gapOverride,
  } = options;

  if (cards.length === 0) return;

  // zone 기본값 = Content Box 전체 (하위 호환)
  const z = zone || { x: CB_X, y: CB_Y, w: CB_W, h: CB_H };

  // density 추론/검증
  const dKey = densityKey || inferDensity(z);
  assertZoneSize(z, dKey);
  const d = DENSITY[dKey];
  const gap = (typeof gapOverride === 'number') ? gapOverride : d.gap;

  const { cols, rows } = gridOverride || resolveGrid(cards.length);

  // 카드 크기 계산 (zone 기준)
  const cardW = (z.w - gap * (cols - 1)) / cols;
  const cardH = (z.h - gap * (rows - 1)) / rows;

  // 렌더러 선택
  const renderers = {
    default: renderDefaultCard,
    dark: renderDarkCard,
    kpi: renderKpiCard,
    'image-overlay': renderImageOverlayCard,
  };
  const render = renderers[style] || renderDefaultCard;

  // 각 카드 렌더링 (zone 기준 좌표)
  cards.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = z.x + col * (cardW + gap);
    const y = z.y + row * (cardH + gap);

    render(sl, pptx, { x, y, w: cardW, h: cardH, card, palette, iconSize, density: d });
  });
}

// Export
module.exports = cardGrid;
module.exports.resolveGrid = resolveGrid;
module.exports.CB_X = CB_X;
module.exports.CB_Y = CB_Y;
module.exports.CB_W = CB_W;
module.exports.CB_H = CB_H;
module.exports.CB_GAP = CB_GAP_DEFAULT;
