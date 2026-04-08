/**
 * ═══════════════════════════════════════════════════════════════════
 *  모듈 ① — AI 브랜드 인텔리전스 (Brand Analyzer)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  기능:
 *   1. 회사명/도메인으로 로고 자동 수집 (Clearbit, Google Favicon)
 *   2. 로고에서 브랜드 주요 색상 추출 (sharp)
 *   3. 6:3:1 팔레트 자동 산출 (HSL 기반)
 *   4. 그래디언트 배경 이미지 자동 생성 (표지/간지/마무리용)
 *
 *  사용법:
 *   const { analyzeBrand, generateGradientBg } = require("./ai_brand_analyzer");
 *   const brand = await analyzeBrand("현대자동차", "hyundai.com");
 *   // brand.palette → { DOM, SEC, ACC, DK, LT, CD, SB, TF }
 *   // brand.logoBase64 → "image/png;base64,..."
 *   // brand.gradients → { cover, divider, ending }
 *
 *  필요 패키지: sharp (npm install sharp)
 * ═══════════════════════════════════════════════════════════════════
 */

const sharp = require("sharp");

// ─────────────────────────────────────────────────
// 1. 색상 유틸리티 (RGB ↔ HSL ↔ Hex 변환)
// ─────────────────────────────────────────────────

function hexToRgb(hex) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  return [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// ─────────────────────────────────────────────────
// 2. 로고 수집 (Clearbit + Google Favicon 폴백)
// ─────────────────────────────────────────────────

/**
 * 회사 도메인에서 로고 이미지를 가져옵니다.
 * @param {string} domain - 회사 도메인 (예: "hyundai.com")
 * @returns {Buffer|null} PNG 이미지 버퍼
 */
async function fetchLogo(domain) {
  const sources = [
    `https://logo.clearbit.com/${domain}?size=512`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    `https://favicon.ico/${domain}/256`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        // 최소 크기 검증 (빈 이미지 필터)
        if (buf.length > 500) {
          // PNG로 변환 (다른 포맷일 수 있으므로)
          return await sharp(buf).png().toBuffer();
        }
      }
    } catch (e) {
      // 다음 소스 시도
    }
  }
  return null;
}

// ─────────────────────────────────────────────────
// 3. 이미지에서 주요 색상 추출
// ─────────────────────────────────────────────────

/**
 * 이미지 버퍼에서 상위 N개 주요 색상을 추출합니다.
 * @param {Buffer} imageBuffer - PNG 이미지 버퍼
 * @param {number} topN - 추출할 색상 수
 * @returns {Array<{hex, count, hsl}>} 주요 색상 배열 (빈도순)
 */
async function extractDominantColors(imageBuffer, topN = 5) {
  // 작은 크기로 리사이즈하여 분석 속도 향상
  const { data, info } = await sharp(imageBuffer)
    .resize(64, 64, { fit: "inside" })
    .removeAlpha()          // 투명 영역 제거
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 색상 빈도 카운트 (8비트 양자화)
  const colorMap = new Map();
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // 너무 밝거나(흰색계) 너무 어두운(검정계) 색상 제외
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness < 30 || brightness > 230) continue;
    // 회색 제외 (채도가 너무 낮은 것)
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max - min < 20) continue;

    // 16단계 양자화 (유사 색상 그룹화)
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    const key = `${qr},${qg},${qb}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  // 빈도순 정렬
  const sorted = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  return sorted.map(([key, count]) => {
    const [r, g, b] = key.split(",").map(Number);
    return {
      hex: rgbToHex(r, g, b),
      count,
      hsl: rgbToHsl(r, g, b),
    };
  });
}

// ─────────────────────────────────────────────────
// 4. 6:3:1 팔레트 생성
// ─────────────────────────────────────────────────

/**
 * 주요 색상으로부터 6:3:1 팔레트를 자동 산출합니다.
 *
 * @param {string} dominantHex - 브랜드 핵심 색상 (예: "2E3092")
 * @param {string} [accentOverride] - 사용자가 직접 지정한 ACCENT 색상 (선택)
 * @returns {Object} 팔레트 객체
 */
function generatePalette(dominantHex, accentOverride) {
  const dom = hexToRgb(dominantHex);
  const hsl = rgbToHsl(dom.r, dom.g, dom.b);

  // DOMINANT (60%) — 원본 그대로
  const DOM = dominantHex.toUpperCase();

  // SECONDARY (30%) — 같은 색조, 채도↓ 밝기↑
  const SEC = hslToHex(hsl.h, Math.min(hsl.s * 0.7, 80), Math.min(hsl.l + 25, 75));

  // ACCENT (10%) — 보색 또는 황금색 계열
  let ACC;
  if (accentOverride) {
    ACC = accentOverride.replace("#", "").toUpperCase();
  } else {
    // 보색(180도 회전) 기반이되, 채도와 밝기를 따뜻하게 조정
    const accH = (hsl.h + 40) % 360;  // 약간 비켜서 더 자연스러운 대비
    ACC = hslToHex(accH, Math.min(hsl.s * 0.85, 90), Math.max(hsl.l, 55));
  }

  // 파생 색상들
  const DK = hslToHex(hsl.h, Math.min(hsl.s * 0.8, 60), 10);        // DARK_BG
  const LT = hslToHex(hsl.h, Math.max(hsl.s * 0.15, 5), 96);         // LIGHT_BG
  const CD = hslToHex(hsl.h, Math.max(hsl.s * 0.12, 3), 95);         // CARD_BG
  const SB = hslToHex(hsl.h, Math.max(hsl.s * 0.18, 5), 94);         // SUBTLE (인사이트 박스)
  const TF = hslToHex(hsl.h, Math.max(hsl.s * 0.25, 8), 65);         // TEXT_FAINT (보조 텍스트)

  return {
    DOM, SEC, ACC, DK, LT, CD, SB, TF,
    // 고정 색상
    W: "FFFFFF",
    TD: "1A1A2E",  // 본문 텍스트
    TG: "6B7280",  // 보조 텍스트 (그레이)
    // 메타 정보
    _source: dominantHex,
    _hsl: hsl,
  };
}

// ─────────────────────────────────────────────────
// 5. 그래디언트 배경 이미지 생성 (SVG → PNG)
// ─────────────────────────────────────────────────

/**
 * SVG 기반 그래디언트 배경 이미지를 생성합니다.
 * pptxgenjs가 gradient fill을 지원하지 않으므로, 이미지로 우회합니다.
 *
 * @param {string} color1 - 시작 색상 (6자리 hex, # 없이)
 * @param {string} color2 - 종료 색상
 * @param {number} width - 가로 px (기본 1169 = 11.69in * 100dpi)
 * @param {number} height - 세로 px (기본 827 = 8.27in * 100dpi)
 * @param {string} direction - 방향: "diagonal", "horizontal", "vertical", "radial"
 * @returns {string} base64 데이터 ("image/png;base64,...")
 */
async function generateGradientBg(color1, color2, width = 1169, height = 827, direction = "diagonal") {
  let svgGradient;
  switch (direction) {
    case "horizontal":
      svgGradient = `<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#${color1}"/>
        <stop offset="100%" stop-color="#${color2}"/>
      </linearGradient>`;
      break;
    case "vertical":
      svgGradient = `<linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#${color1}"/>
        <stop offset="100%" stop-color="#${color2}"/>
      </linearGradient>`;
      break;
    case "radial":
      svgGradient = `<radialGradient id="g" cx="30%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#${color1}"/>
        <stop offset="100%" stop-color="#${color2}"/>
      </radialGradient>`;
      break;
    case "diagonal":
    default:
      svgGradient = `<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#${color1}"/>
        <stop offset="100%" stop-color="#${color2}"/>
      </linearGradient>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>${svgGradient}</defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

/**
 * 표지/간지/마무리용 장식 패턴이 포함된 배경을 생성합니다.
 * 그래디언트 + 반투명 기하학 도형으로 시각적 깊이감을 줍니다.
 *
 * @param {string} baseColor - DOMINANT 색상 (hex)
 * @param {string} type - "cover" | "divider" | "ending"
 * @returns {string} base64 PNG 데이터
 */
async function generateDecorativeBg(baseColor, type = "cover") {
  const hsl = rgbToHsl(...Object.values(hexToRgb(baseColor)));
  const darkColor = hslToHex(hsl.h, Math.min(hsl.s * 0.9, 70), 8);
  const midColor = hslToHex(hsl.h, Math.min(hsl.s * 0.8, 65), 18);
  const accentColor = hslToHex(hsl.h, Math.min(hsl.s * 0.6, 50), 40);

  let decorations = "";

  if (type === "cover") {
    // 표지: 다크 그래디언트 + 투명 원형 + 상단 컬러 바
    decorations = `
      <rect x="0" y="0" width="1169" height="220" fill="#${baseColor}" opacity="0.9"/>
      <rect x="0" y="205" width="1169" height="15" fill="#${accentColor}" opacity="0.7"/>
      <circle cx="950" cy="120" r="160" fill="#${accentColor}" opacity="0.12"/>
      <circle cx="1050" cy="650" r="200" fill="#${accentColor}" opacity="0.06"/>
      <circle cx="-50" cy="700" r="180" fill="#${accentColor}" opacity="0.05"/>
    `;
  } else if (type === "divider") {
    // 간지: 솔리드 + 우측 투명 바 + 하단 라인
    decorations = `
      <rect x="980" y="0" width="189" height="827" fill="#${accentColor}" opacity="0.08"/>
      <rect x="0" y="760" width="1169" height="5" fill="#${accentColor}" opacity="0.3"/>
      <circle cx="1100" cy="150" r="100" fill="#${accentColor}" opacity="0.07"/>
    `;
  } else if (type === "ending") {
    // 마무리: 원형 장식 + 중앙 집중
    decorations = `
      <circle cx="900" cy="-100" r="400" fill="#${accentColor}" opacity="0.08"/>
      <circle cx="-100" cy="600" r="300" fill="#${accentColor}" opacity="0.06"/>
      <rect x="430" y="250" width="309" height="3" fill="#${accentColor}" opacity="0.4"/>
    `;
  }

  const bgGradient = type === "divider"
    ? `<rect width="100%" height="100%" fill="#${baseColor}"/>`
    : `<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#${darkColor}"/>
        <stop offset="60%" stop-color="#${midColor}"/>
        <stop offset="100%" stop-color="#${darkColor}"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1169" height="827">
    ${bgGradient}
    ${decorations}
  </svg>`;

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// ─────────────────────────────────────────────────
// 6. 메인 분석 함수
// ─────────────────────────────────────────────────

/**
 * 회사 브랜드를 분석하여 PPT 생성에 필요한 모든 시각 자산을 반환합니다.
 *
 * @param {string} companyName - 회사명 (한국어 가능)
 * @param {string} [domain] - 회사 도메인 (없으면 로고 수집 건너뜀)
 * @param {Object} [overrides] - 수동 오버라이드 { dominant, accent }
 * @returns {Object} 브랜드 분석 결과
 *
 * @example
 * const brand = await analyzeBrand("현대자동차", "hyundai.com");
 * console.log(brand.palette.DOM); // "002C5F"
 * console.log(brand.gradients.cover); // "image/png;base64,..."
 */
async function analyzeBrand(companyName, domain, overrides = {}) {
  console.log(`[BrandAnalyzer] 브랜드 분석 시작: ${companyName}`);

  let dominantHex = overrides.dominant;
  let logoBase64 = null;

  // ── Step 1: 로고 수집 ──
  if (domain && !dominantHex) {
    console.log(`[BrandAnalyzer] 로고 수집 중: ${domain}`);
    const logoBuffer = await fetchLogo(domain);

    if (logoBuffer) {
      logoBase64 = "image/png;base64," + logoBuffer.toString("base64");
      console.log(`[BrandAnalyzer] 로고 수집 완료 (${logoBuffer.length} bytes)`);

      // ── Step 2: 색상 추출 ──
      const colors = await extractDominantColors(logoBuffer);
      if (colors.length > 0) {
        dominantHex = colors[0].hex;
        console.log(`[BrandAnalyzer] 추출된 주요 색상: #${dominantHex}`);
        console.log(`[BrandAnalyzer] 전체 색상 목록:`, colors.map(c => `#${c.hex} (${c.count})`));
      }
    } else {
      console.log(`[BrandAnalyzer] 로고 수집 실패 — 기본 색상 사용`);
    }
  }

  // 기본값 (색상 추출 실패 시)
  if (!dominantHex) {
    dominantHex = "2E3092";
    console.log(`[BrandAnalyzer] 기본 색상 사용: #${dominantHex}`);
  }

  // ── Step 3: 팔레트 생성 ──
  const palette = generatePalette(dominantHex, overrides.accent);
  console.log(`[BrandAnalyzer] 6:3:1 팔레트 생성 완료:`);
  console.log(`  DOMINANT (60%): #${palette.DOM}`);
  console.log(`  SECONDARY(30%): #${palette.SEC}`);
  console.log(`  ACCENT   (10%): #${palette.ACC}`);
  console.log(`  DARK_BG:  #${palette.DK}  |  LIGHT_BG: #${palette.LT}`);
  console.log(`  CARD_BG:  #${palette.CD}  |  SUBTLE:   #${palette.SB}`);

  // ── Step 4: 배경 이미지 생성 ──
  console.log(`[BrandAnalyzer] 그래디언트 배경 생성 중...`);
  const [coverBg, dividerBg, endingBg] = await Promise.all([
    generateDecorativeBg(palette.DOM, "cover"),
    generateDecorativeBg(palette.DOM, "divider"),
    generateDecorativeBg(palette.DOM, "ending"),
  ]);

  // ── Step 5: 간지용 심플 그래디언트 (대안)
  const dividerGradient = await generateGradientBg(palette.DOM, palette.DK, 1169, 827, "diagonal");

  console.log(`[BrandAnalyzer] 분석 완료!`);

  return {
    companyName,
    domain: domain || null,
    palette,
    logoBase64,
    gradients: {
      cover: coverBg,           // 표지 배경 (다크 그래디언트 + 장식)
      divider: dividerBg,       // 간지 배경 (DOMINANT + 장식)
      dividerSimple: dividerGradient, // 간지 대안 (심플 그래디언트)
      ending: endingBg,         // 마무리 배경 (다크 + 원형 장식)
    },
    // PPT 코드에서 바로 사용할 수 있는 변수 선언문
    toPptxCode() {
      return `
// ━━━ 브랜드 색상 (${companyName} — 자동 추출) ━━━
const DOM = '${palette.DOM}';    // DOMINANT (60%)
const SEC = '${palette.SEC}';    // SECONDARY (30%)
const ACC = '${palette.ACC}';    // ACCENT (10%)
const DK  = '${palette.DK}';     // DARK_BG
const LT  = '${palette.LT}';     // LIGHT_BG
const CD  = '${palette.CD}';     // CARD_BG
const SB  = '${palette.SB}';     // SUBTLE
const TF  = '${palette.TF}';     // TEXT_FAINT
const W   = 'FFFFFF';
const TD  = '1A1A2E';
const TG  = '6B7280';
const FN  = 'Pretendard';
`.trim();
    },
  };
}

// ─────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────

module.exports = {
  analyzeBrand,
  generatePalette,
  generateGradientBg,
  generateDecorativeBg,
  fetchLogo,
  extractDominantColors,
  // 유틸리티 (외부에서 필요할 수 있음)
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb, hslToHex,
};

// ─────────────────────────────────────────────────
// CLI 직접 실행
// ─────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const companyName = args[0] || "그라운드케이";
  const domain = args[1] || "groundk.kr";

  analyzeBrand(companyName, domain)
    .then(result => {
      console.log("\n═══ 결과 요약 ═══");
      console.log("로고:", result.logoBase64 ? "수집됨" : "없음");
      console.log("팔레트:", JSON.stringify(result.palette, null, 2));
      console.log("\n═══ PPT 코드 변수 ═══");
      console.log(result.toPptxCode());
      console.log("\n═══ 배경 이미지 ═══");
      console.log("표지 배경:", result.gradients.cover.substring(0, 50) + "...");
      console.log("간지 배경:", result.gradients.divider.substring(0, 50) + "...");
      console.log("마무리 배경:", result.gradients.ending.substring(0, 50) + "...");
    })
    .catch(err => console.error("에러:", err));
}
