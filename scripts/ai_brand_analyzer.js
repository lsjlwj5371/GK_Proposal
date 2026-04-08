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
// 4. 색상 조화 규칙 (Adobe Color Harmony 기반)
// ─────────────────────────────────────────────────

/**
 * Adobe Color의 색상 조화 규칙(Color Harmony Rules)을 기반으로
 * 주어진 기준 색상에 대해 조화로운 보조 색상을 생성합니다.
 *
 * ★ 핵심 원칙:
 *   - 메인 색상(DOM): 브랜드/대상의 CI 색상 그대로 사용
 *   - 보조 색상(SEC, ACC): 브랜드 색상에서 파생하지 않고,
 *     색상 조화 이론에 따라 메인과 함께 썼을 때 가장 적절한 독립적 색상을 선택
 *
 * @see https://color.adobe.com/create/color-wheel
 */

const COLOR_HARMONIES = {
  /**
   * Split-Complementary (분할보색)
   * - 보색(180°)의 양쪽 이웃 색상을 사용
   * - 보색보다 부드럽지만 충분한 대비 → 비즈니스 제안서에 가장 적합
   * - SEC: 기준색 +150°, ACC: 기준색 +210°
   */
  splitComplementary: (h) => ({
    sec: (h + 150) % 360,
    acc: (h + 210) % 360,
    name: "Split-Complementary",
    description: "보색의 양쪽 이웃 — 세련된 대비감"
  }),

  /**
   * Triadic (삼각조화)
   * - 색상환에서 120° 간격의 세 색상
   * - 에너지 넘치는 느낌, 대비가 강함 → 스포츠, 이벤트, 역동적 제안서
   */
  triadic: (h) => ({
    sec: (h + 120) % 360,
    acc: (h + 240) % 360,
    name: "Triadic",
    description: "120° 등간격 — 역동적이고 활기찬"
  }),

  /**
   * Complementary (보색)
   * - 색상환에서 정반대(180°) 색상 + 30° 이웃
   * - 강한 대비, 주목도 높음 → KPI 강조, 성과 발표
   */
  complementary: (h) => ({
    sec: (h + 180) % 360,
    acc: (h + 150) % 360,
    name: "Complementary",
    description: "정반대 보색 — 강한 대비와 주목도"
  }),

  /**
   * Analogous + Complement (유사색 + 보색 포인트)
   * - SEC는 이웃 색상(조화로움), ACC는 보색(강조 포인트)
   * - 안정적이면서도 포인트가 있음 → 격식 있는 공식 제안서
   */
  analogousComplement: (h) => ({
    sec: (h + 30) % 360,
    acc: (h + 180) % 360,
    name: "Analogous + Complement",
    description: "유사색 안정감 + 보색 포인트"
  }),

  /**
   * Square (정사각 조화)
   * - 색상환에서 90° 간격 중 2개 선택
   * - 다채로운 느낌 → 크리에이티브, 문화 행사
   */
  square: (h) => ({
    sec: (h + 90) % 360,
    acc: (h + 270) % 360,
    name: "Square",
    description: "90° 간격 — 다채롭고 풍부한"
  }),
};

/**
 * 제안서 주제/분위기에 따라 가장 적합한 색상 조화 규칙을 추천합니다.
 *
 * @param {string} [mood] - 분위기 키워드
 *   "professional" → Split-Complementary (기본값)
 *   "dynamic"/"sports"/"energy" → Triadic
 *   "bold"/"impact"/"kpi" → Complementary
 *   "formal"/"official"/"government" → Analogous + Complement
 *   "creative"/"culture"/"event" → Square
 * @returns {string} COLOR_HARMONIES의 키
 */
function selectHarmonyRule(mood = "professional") {
  const moodMap = {
    professional: "splitComplementary",
    corporate: "splitComplementary",
    business: "splitComplementary",
    dynamic: "triadic",
    sports: "triadic",
    energy: "triadic",
    esports: "triadic",
    bold: "complementary",
    impact: "complementary",
    kpi: "complementary",
    formal: "analogousComplement",
    official: "analogousComplement",
    government: "analogousComplement",
    creative: "square",
    culture: "square",
    event: "square",
    festival: "square",
  };

  const key = Object.keys(moodMap).find(k =>
    mood.toLowerCase().includes(k)
  );
  return moodMap[key] || "splitComplementary";
}

/**
 * 주요 색상으로부터 6:3:1 팔레트를 자동 산출합니다.
 *
 * ★ 색상 생성 원칙:
 *   1. DOM(60%): 브랜드 CI 색상 그대로 → 로고에서 추출하거나 사용자 지정
 *   2. SEC(30%): DOM과 독립적인 색상 → 색상 조화 이론(Adobe Color)으로 선택
 *   3. ACC(10%): DOM과 독립적인 색상 → 색상 조화 이론(Adobe Color)으로 선택
 *   → SEC/ACC는 브랜드 색상의 밝기/채도 변형이 아닌, 색상환에서 조화 규칙에 따른 별도 색상
 *
 * @param {string} dominantHex - 브랜드 핵심 색상 (예: "2E3092")
 * @param {Object} [options] - 옵션
 * @param {string} [options.accent] - 사용자가 직접 지정한 ACCENT 색상
 * @param {string} [options.secondary] - 사용자가 직접 지정한 SECONDARY 색상
 * @param {string} [options.mood] - 분위기 (색상 조화 규칙 선택에 사용)
 * @param {string} [options.harmony] - 직접 조화 규칙 지정 (splitComplementary, triadic, etc.)
 * @returns {Object} 팔레트 객체
 */
function generatePalette(dominantHex, options = {}) {
  // 이전 API 호환성: 두번째 인자가 문자열이면 accentOverride로 처리
  if (typeof options === "string") {
    options = { accent: options };
  }

  const dom = hexToRgb(dominantHex);
  const hsl = rgbToHsl(dom.r, dom.g, dom.b);

  // ── DOMINANT (60%) — 브랜드 CI 색상 그대로 ──
  const DOM = dominantHex.replace("#", "").toUpperCase();

  // ── 색상 조화 규칙 선택 ──
  const harmonyKey = options.harmony || selectHarmonyRule(options.mood || "professional");
  const harmony = COLOR_HARMONIES[harmonyKey](hsl.h);

  // ── SECONDARY (30%) — 조화 규칙 기반 독립 색상 ──
  let SEC;
  if (options.secondary) {
    SEC = options.secondary.replace("#", "").toUpperCase();
  } else {
    // 색상 조화 규칙에서 산출된 Hue를 사용하되,
    // 채도는 DOM과 비슷한 수준, 밝기는 약간 밝게 (배경·카드 용도이므로)
    const secS = Math.min(Math.max(hsl.s * 0.75, 30), 80);
    const secL = Math.min(Math.max(hsl.l + 10, 40), 65);
    SEC = hslToHex(harmony.sec, secS, secL);
  }

  // ── ACCENT (10%) — 조화 규칙 기반 독립 강조 색상 ──
  let ACC;
  if (options.accent) {
    ACC = options.accent.replace("#", "").toUpperCase();
  } else {
    // ACC는 눈에 띄어야 하므로 채도 높고 밝기는 중상
    const accS = Math.min(Math.max(hsl.s * 0.9, 50), 95);
    const accL = Math.min(Math.max(hsl.l, 45), 60);
    ACC = hslToHex(harmony.acc, accS, accL);
  }

  // ── 파생 색상들 (DOM 기반으로 통일감 유지) ──
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
    _harmony: harmony.name,
    _harmonyDescription: harmony.description,
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
 * @param {Object} [overrides] - 수동 오버라이드
 *   { dominant, accent, secondary, mood, harmony }
 *   - mood: "professional"|"dynamic"|"sports"|"bold"|"formal"|"creative"
 *   - harmony: "splitComplementary"|"triadic"|"complementary"|"analogousComplement"|"square"
 * @returns {Object} 브랜드 분석 결과
 *
 * @example
 * const brand = await analyzeBrand("현대자동차", "hyundai.com", { mood: "professional" });
 * console.log(brand.palette.DOM); // "002C5F"
 * console.log(brand.palette._harmony); // "Split-Complementary"
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

  // ── Step 3: 팔레트 생성 (Adobe Color Harmony 기반) ──
  const palette = generatePalette(dominantHex, {
    accent: overrides.accent,
    secondary: overrides.secondary,
    mood: overrides.mood,
    harmony: overrides.harmony,
  });
  console.log(`[BrandAnalyzer] 6:3:1 팔레트 생성 완료 (${palette._harmony}):`);
  console.log(`  DOMINANT (60%): #${palette.DOM}  ← 브랜드 CI`);
  console.log(`  SECONDARY(30%): #${palette.SEC}  ← ${palette._harmony} 조화색`);
  console.log(`  ACCENT   (10%): #${palette.ACC}  ← ${palette._harmony} 강조색`);
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
  selectHarmonyRule,
  COLOR_HARMONIES,
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
