/**
 * highlight_body.js
 * -------------------------------------------------------------------------
 * Parameterized pptxgenjs component for highlight/emphasis body pages.
 *
 * Three variants:
 *   A  "dark-keywords"          -- Dark background + circular keyword badges
 *   B  "image-overlay-message"  -- Full-bleed image + gradient overlay + large message
 *   C  "split-impact"           -- Upper light / lower dark split with icon badges
 *
 * Slide size: 11.69 x 8.27 inches (A4 landscape)
 *
 * Header coordinates are identical to standard body pages (section 6 spec):
 *   pageNum+label   x=0.47  y=0.21  w=5.00  h=0.25
 *   headline        x=0.47  y=0.68  w=10.75 h=0.47
 *   subtitle        x=0.47  y=1.18  w=10.75 h=0.29
 *   divider line    x=0.47  y=1.55  w=10.75 h=0.015
 *   content area    x=0.47  y=2.00  w=10.75 h=5.50
 * -------------------------------------------------------------------------
 */

'use strict';

// ━━━ Layout Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SLIDE_W = 11.69;
const SLIDE_H = 8.27;

// Header area (absolute -- matches standard body pages)
const HDR_X = 0.47;
const HDR_LABEL_Y = 0.21;
const HDR_LABEL_H = 0.25;
const HDR_MSG_Y = 0.68;
const HDR_MSG_W = 10.75;
const HDR_MSG_H = 0.47;
const HDR_SUB_Y = 1.18;
const HDR_SUB_H = 0.29;
const HDR_LINE_Y = 1.55;
const HDR_LINE_H = 0.015;

// Content area
const CB_X = 0.47;
const CB_Y = 2.00;
const CB_W = 10.75;
const CB_H = 5.50;

// Fonts
const FN    = 'Pretendard';
const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN_TN = 'Pretendard Thin';

// ━━━ Helper: safe color (strip leading '#') ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function c(hex) {
  if (!hex) return 'FFFFFF';
  return String(hex).replace(/^#/, '');
}

// ━━━ Shared: Header renderer (dark-aware) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function addHeader(sl, pptx, { pageNum, sectionLabel, headline, subtitle, palette, darkBg }) {
  const txtLight = darkBg;  // true => white text
  const labelColor   = txtLight ? 'FFFFFF' : c(palette.DOM);
  const tocColor     = txtLight ? 'C0C0C0' : '6B7280';
  const headColor    = txtLight ? 'FFFFFF' : '1A1A2E';
  const subColor     = txtLight ? 'B0B0B0' : '6B7280';
  const lineColor    = txtLight ? c(palette.ACC || 'FFFFFF') : c(palette.SEC || 'D1D5DB');

  // 1. Page number + section label
  sl.addText([
    { text: pageNum || '', options: { fontSize: 10, color: labelColor, bold: true, fontFace: FN } },
    { text: '  ' + (sectionLabel || ''), options: { fontSize: 9, color: tocColor, fontFace: FN } },
  ], { x: HDR_X, y: HDR_LABEL_Y, w: 5.0, h: HDR_LABEL_H, margin: 0 });

  // 2. Headline (Bold 16pt)
  sl.addText(headline || '', {
    x: HDR_X, y: HDR_MSG_Y, w: HDR_MSG_W, h: HDR_MSG_H,
    fontSize: 16, fontFace: FN_XB, bold: true, color: headColor, margin: 0,
  });

  // 3. Subtitle (10pt)
  sl.addText(subtitle || '', {
    x: HDR_X, y: HDR_SUB_Y, w: HDR_MSG_W, h: HDR_SUB_H,
    fontSize: 10, fontFace: FN, color: subColor, margin: 0,
  });

  // 4. Divider line
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: HDR_X, y: HDR_LINE_Y, w: HDR_MSG_W, h: HDR_LINE_H,
    fill: { color: lineColor },
    line: { width: 0 },
  });
}

// ━━━ Type A: dark-keywords ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderDarkKeywords(sl, pptx, opts) {
  const { message, keywords = [], insightText, palette } = opts;
  const bgColor = c(palette.DK || palette.DOM || '0D0D2B');

  // -- Full dark background
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: { color: bgColor },
    line: { width: 0 },
  });

  // -- Header (white text on dark)
  addHeader(sl, pptx, { ...opts, darkBg: true });

  // -- Central declarative message
  if (message) {
    sl.addText(message, {
      x: CB_X, y: CB_Y + 0.20, w: CB_W, h: 1.00,
      fontSize: 22, fontFace: FN_XB, color: 'FFFFFF',
      bold: true, align: 'center', valign: 'middle', margin: 0,
      lineSpacingMultiple: 1.3,
    });
  }

  // -- Keyword badges (horizontal layout)
  const kw = keywords.slice(0, 5);
  const kwCount = kw.length;
  if (kwCount > 0) {
    const circleD = 1.30;           // diameter
    const gap = 0.60;               // gap between circles
    const totalW = kwCount * circleD + (kwCount - 1) * gap;
    const startX = (SLIDE_W - totalW) / 2;
    const circleY = CB_Y + 1.60;   // vertical position of circle center area

    kw.forEach((item, i) => {
      const cx = startX + i * (circleD + gap);

      // Circle: outline-only (transparent fill, white border)
      sl.addShape(pptx.shapes.OVAL, {
        x: cx, y: circleY, w: circleD, h: circleD,
        fill: { color: 'FFFFFF', transparency: 100 },
        line: { color: 'FFFFFF', width: 1.5, dashType: 'solid' },
      });

      // Icon text inside circle (optional -- use emoji or symbol placeholder)
      if (item.icon) {
        sl.addText(item.icon, {
          x: cx, y: circleY + 0.15, w: circleD, h: circleD * 0.50,
          fontSize: 26, fontFace: FN, color: 'FFFFFF',
          align: 'center', valign: 'middle', margin: 0,
        });
      }

      // English keyword label (below or inside circle)
      sl.addText(item.label || '', {
        x: cx - 0.15, y: circleY + circleD + 0.12, w: circleD + 0.30, h: 0.30,
        fontSize: 11, fontFace: FN_XB, color: 'FFFFFF',
        bold: true, align: 'center', valign: 'top', margin: 0,
      });

      // Korean sublabel (below keyword)
      if (item.sublabel) {
        sl.addText(item.sublabel, {
          x: cx - 0.15, y: circleY + circleD + 0.40, w: circleD + 0.30, h: 0.28,
          fontSize: 9, fontFace: FN_MD, color: 'B0B0B0',
          align: 'center', valign: 'top', margin: 0,
        });
      }

      // Optional description (smaller, below sublabel)
      if (item.description) {
        sl.addText(item.description, {
          x: cx - 0.20, y: circleY + circleD + 0.68, w: circleD + 0.40, h: 0.40,
          fontSize: 8, fontFace: FN_TN, color: '9B9B9B',
          align: 'center', valign: 'top', margin: 0,
          lineSpacingMultiple: 1.2,
        });
      }
    });
  }

  // -- Bottom closing statement / insight bar
  if (insightText) {
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: SLIDE_H - 0.80, w: SLIDE_W, h: 0.60,
      fill: { color: c(palette.ACC || 'FF6B35'), transparency: 15 },
      line: { width: 0 },
    });
    sl.addText(insightText, {
      x: CB_X, y: SLIDE_H - 0.78, w: CB_W, h: 0.56,
      fontSize: 11, fontFace: FN_MD, color: 'FFFFFF',
      align: 'center', valign: 'middle', margin: 0,
    });
  }
}

// ━━━ Type B: image-overlay-message ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderImageOverlayMessage(sl, pptx, opts) {
  const { message, keywords = [], insightText, palette } = opts;

  // -- Full-bleed image placeholder (background)
  // [IMAGE: Full-bleed background image covering entire slide]
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: { color: '2A2A3D' },  // placeholder dark fill
    line: { width: 0 },
  });
  // [IMAGE: Replace the rectangle above with pptx.addImage() for actual background image]
  // Example: sl.addImage({ path: 'bg.jpg', x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });

  // -- Semi-transparent gradient overlay (top transparent -> bottom opaque)
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: {
      type: 'gradient',
      stops: [
        { position: 0,   color: '000000', transparency: 80 },
        { position: 50,  color: '000000', transparency: 50 },
        { position: 100, color: '000000', transparency: 10 },
      ],
    },
    line: { width: 0 },
  });

  // -- Header (white text on dark overlay)
  addHeader(sl, pptx, { ...opts, darkBg: true });

  // -- Central large message
  if (message) {
    sl.addText(message, {
      x: CB_X, y: CB_Y + 0.60, w: CB_W, h: 1.40,
      fontSize: 26, fontFace: FN_XB, color: 'FFFFFF',
      bold: true, align: 'center', valign: 'middle', margin: 0,
      lineSpacingMultiple: 1.4,
    });
  }

  // -- Emotional/poetic sub-copy (from keywords[0].description or first keyword label)
  const subCopy = (keywords[0] && keywords[0].description) || '';
  if (subCopy) {
    sl.addText(subCopy, {
      x: CB_X + 1.0, y: CB_Y + 2.20, w: CB_W - 2.0, h: 0.60,
      fontSize: 12, fontFace: FN_TN, color: 'D0D0D0',
      align: 'center', valign: 'middle', margin: 0,
      italic: true,
    });
  }

  // -- (image placeholder rect/text removed — was visible artifact in real PPTs) --

  // -- Bottom insight bar
  if (insightText) {
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: SLIDE_H - 0.65, w: SLIDE_W, h: 0.50,
      fill: { color: '000000', transparency: 30 },
      line: { width: 0 },
    });
    sl.addText(insightText, {
      x: CB_X, y: SLIDE_H - 0.63, w: CB_W, h: 0.46,
      fontSize: 11, fontFace: FN_MD, color: 'FFFFFF',
      align: 'center', valign: 'middle', margin: 0,
    });
  }
}

// ━━━ Type C: split-impact ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderSplitImpact(sl, pptx, opts) {
  const { message, keywords = [], insightText, palette } = opts;
  const splitY = SLIDE_H * 0.42;   // ~40% upper, ~60% lower

  // -- Upper portion: white/light background (default slide bg is white)
  // No shape needed -- slide background is white by default.

  // -- Header (dark text on light background)
  addHeader(sl, pptx, { ...opts, darkBg: false });

  // -- Upper area: explanatory text with bold keywords
  if (message) {
    sl.addText(message, {
      x: CB_X, y: CB_Y, w: CB_W, h: splitY - CB_Y - 0.15,
      fontSize: 14, fontFace: FN_MD, color: '333333',
      align: 'left', valign: 'middle', margin: [0, 10, 0, 0],
      lineSpacingMultiple: 1.5,
    });
  }

  // -- Accent bar separating the two sections
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: splitY - 0.03, w: SLIDE_W, h: 0.06,
    fill: { color: c(palette.ACC || 'FF6B35') },
    line: { width: 0 },
  });

  // -- Lower portion: DOM/dark color block
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: splitY, w: SLIDE_W, h: SLIDE_H - splitY,
    fill: { color: c(palette.DK || palette.DOM || '1A1A2E') },
    line: { width: 0 },
  });

  // -- Circular icon badges in lower section
  const kw = keywords.slice(0, 4);
  const kwCount = kw.length;
  if (kwCount > 0) {
    const circleD = 1.20;
    const gap = 0.80;
    const totalW = kwCount * circleD + (kwCount - 1) * gap;
    const startX = (SLIDE_W - totalW) / 2;
    const circleTopY = splitY + 0.50;

    kw.forEach((item, i) => {
      const cx = startX + i * (circleD + gap);

      // Colored circle background (DOM-based, slightly lighter)
      sl.addShape(pptx.shapes.OVAL, {
        x: cx, y: circleTopY, w: circleD, h: circleD,
        fill: { color: c(palette.DOM || '3B3B6D'), transparency: 30 },
        line: { color: 'FFFFFF', width: 1.0 },
      });

      // Icon inside circle (white)
      if (item.icon) {
        sl.addText(item.icon, {
          x: cx, y: circleTopY + 0.10, w: circleD, h: circleD * 0.55,
          fontSize: 28, fontFace: FN, color: 'FFFFFF',
          align: 'center', valign: 'middle', margin: 0,
        });
      }

      // Service/value label below circle
      sl.addText(item.label || '', {
        x: cx - 0.20, y: circleTopY + circleD + 0.10, w: circleD + 0.40, h: 0.30,
        fontSize: 11, fontFace: FN_XB, color: 'FFFFFF',
        bold: true, align: 'center', valign: 'top', margin: 0,
      });

      // Korean sublabel
      if (item.sublabel) {
        sl.addText(item.sublabel, {
          x: cx - 0.20, y: circleTopY + circleD + 0.38, w: circleD + 0.40, h: 0.26,
          fontSize: 9, fontFace: FN_MD, color: 'C0C0C0',
          align: 'center', valign: 'top', margin: 0,
        });
      }
    });
  }

  // -- Bottom insight bar (full-width, ACC color, key takeaway)
  if (insightText) {
    const barH = 0.50;
    const barY = SLIDE_H - barH;
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: barY, w: SLIDE_W, h: barH,
      fill: { color: c(palette.ACC || 'FF6B35') },
      line: { width: 0 },
    });
    sl.addText(insightText, {
      x: CB_X, y: barY + 0.02, w: CB_W, h: barH - 0.04,
      fontSize: 11, fontFace: FN_XB, color: 'FFFFFF',
      bold: true, align: 'center', valign: 'middle', margin: 0,
    });
  }
}

// ━━━ Public API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/**
 * Create a highlight/emphasis body slide.
 *
 * @param {Object} sl       - pptxgenjs slide object (already created via pptx.addSlide())
 * @param {Object} pptx     - pptxgenjs Presentation instance (for pptx.shapes.*)
 * @param {Object} opts     - Configuration object
 * @param {string} opts.type           - 'dark-keywords' | 'image-overlay-message' | 'split-impact'
 * @param {string} opts.pageNum        - Page number string, e.g. "05"
 * @param {string} opts.sectionLabel   - Section label, e.g. "01 | 시장 현황"
 * @param {string} opts.headline       - Header headline (ExtraBold, 16pt)
 * @param {string} opts.subtitle       - Header subtitle (Regular, 10pt)
 * @param {string} opts.message        - Central declarative message
 * @param {Array}  opts.keywords       - Array of { icon?, label, sublabel?, description? }
 * @param {string} [opts.insightText]  - Bottom insight bar text (optional)
 * @param {Object} opts.palette        - Color palette: { DOM, SEC, ACC, DK, LT, CD, ... }
 *
 * @example
 * const createHighlightBody = require('./highlight_body');
 * const slide = pptx.addSlide();
 * createHighlightBody(slide, pptx, {
 *   type: 'dark-keywords',
 *   pageNum: '05',
 *   sectionLabel: '02 | 핵심 전략',
 *   headline: '5가지 핵심 운영 전략',
 *   subtitle: '대회 성공을 위한 통합 수송 전략 체계',
 *   message: '안전하고 효율적인 대회 수송의 새로운 기준',
 *   keywords: [
 *     { icon: '\u{1F6E1}', label: 'SAFETY', sublabel: '안전 관리' },
 *     { icon: '\u{1F552}', label: 'SPEED',  sublabel: '신속 대응' },
 *     { icon: '\u{1F91D}', label: 'TRUST',  sublabel: '신뢰 구축' },
 *   ],
 *   insightText: '"경험이 곧 실력입니다"',
 *   palette: { DOM: '#1B3A5C', SEC: '#4A90D9', ACC: '#FF6B35', DK: '#0A1628' },
 * });
 */
module.exports = function createHighlightBody(sl, pptx, opts) {
  if (!sl || !pptx || !opts) {
    throw new Error('createHighlightBody: sl, pptx, and opts are required');
  }

  const palette = opts.palette || {};

  // Normalize palette values (strip '#')
  const normalizedPalette = {};
  for (const key of Object.keys(palette)) {
    normalizedPalette[key] = c(palette[key]);
  }
  const safeOpts = { ...opts, palette: normalizedPalette };

  switch (opts.type) {
    case 'dark-keywords':
      renderDarkKeywords(sl, pptx, safeOpts);
      break;

    case 'image-overlay-message':
      renderImageOverlayMessage(sl, pptx, safeOpts);
      break;

    case 'split-impact':
      renderSplitImpact(sl, pptx, safeOpts);
      break;

    default:
      throw new Error(
        `createHighlightBody: unknown type "${opts.type}". ` +
        'Expected "dark-keywords", "image-overlay-message", or "split-impact".'
      );
  }
};

// Export sub-renderers for direct access if needed
module.exports.renderDarkKeywords = renderDarkKeywords;
module.exports.renderImageOverlayMessage = renderImageOverlayMessage;
module.exports.renderSplitImpact = renderSplitImpact;
module.exports.addHeader = addHeader;
