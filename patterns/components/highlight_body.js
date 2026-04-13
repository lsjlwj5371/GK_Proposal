/**
 * highlight_body.js - Highlight/emphasis body pages (AP-01~AP-27 compliant)
 * -------------------------------------------------------------------------
 * Complete rewrite: addHeader OOXML bug removed.
 * Header is now rendered manually (identical to standard body pages).
 *
 * Three variants:
 *   A  "dark-keywords"          -- Dark bg + large hero message + KPI badges
 *   B  "image-overlay-message"  -- Full-bleed dark + gradient + large message
 *   C  "split-impact"           -- Upper hero message + lower dark KPI badges
 *
 * AP compliance:
 *   - AP-12: No charSpacing on Korean text
 *   - AP-14: No emoji characters
 *   - AP-15: No bold: true (use FN_XB fontFace)
 *   - AP-21: Left vertical bar instead of top accent bar
 *   - AP-24: Shadow factory sdw()
 *   - AP-25: margin: 0 only (no array)
 *   - AP-27: wrap: false + margin: 0 on single-line text
 *   - All shapes use line: { type: 'none' }
 *
 * Slide size: 11.69 x 8.27 inches (A4 landscape)
 * -------------------------------------------------------------------------
 */

'use strict';

// Layout Constants
const SW = 11.69;
const SH = 8.27;

// Content Box
const CB_X = 0.53;
const CB_Y = 1.77;
const CB_W = 10.63;
const CB_H = 5.91;
const CB_PAD = 0.15;

// Fonts
const FN    = 'Pretendard';
const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN_TN = 'Pretendard Thin';

// Shadow factory (AP-24)
const sdw = () => ({ type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 });

// Safe color (strip leading '#')
function c(hex) {
  if (!hex) return 'FFFFFF';
  return String(hex).replace(/^#/, '');
}

// ---- Manual header renderer (replaces buggy addHeader) ----
function renderHeader(sl, pptx, { chapter, msg, sub, palette, darkBg }) {
  const labelColor = darkBg ? 'AAAAAA' : c(palette.TG || '888888');
  const headColor  = darkBg ? 'FFFFFF' : c(palette.BODY_CLR || '333355');
  const subColor   = darkBg ? 'B0B0B0' : c(palette.TG || '888888');
  const lineColor  = c(palette.DOM || 'CC0033');

  // Chapter label
  sl.addText(chapter || '', {
    x: 0.47, y: 0.21, w: 5.0, h: 0.25,
    fontSize: 9, fontFace: FN_MD, color: labelColor,
    wrap: false, margin: 0,
  });

  // Headline
  sl.addText(msg || '', {
    x: 0.47, y: 0.68, w: 10.75, h: 0.47,
    fontSize: 16, fontFace: FN_XB, color: headColor,
    wrap: false, margin: 0,
  });

  // Subtitle
  if (sub) {
    sl.addText(sub, {
      x: 0.47, y: 1.18, w: 10.75, h: 0.29,
      fontSize: 10, fontFace: FN, color: subColor,
      wrap: false, margin: 0,
    });
  }

  // Divider line
  const lineFill = darkBg
    ? { color: lineColor }
    : { color: lineColor };
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0.47, y: 1.55, w: 10.75, h: 0.015,
    fill: lineFill,
    line: { type: 'none' },
  });
}

// ---- Type A: dark-keywords ----
function renderDarkKeywords(sl, pptx, opts) {
  const { message, badges = [], insightText, palette } = opts;
  const bgColor = c(palette.DK || palette.DOM || '0D0D2B');

  // Full dark background
  sl.background = { fill: bgColor };

  // Header (white text on dark)
  renderHeader(sl, pptx, { ...opts, darkBg: true });

  // Hero message (center)
  if (message) {
    sl.addText(message, {
      x: CB_X + CB_PAD, y: CB_Y + 0.30,
      w: CB_W - CB_PAD * 2, h: 2.2,
      fontSize: 30, fontFace: FN_XB, color: 'FFFFFF',
      align: 'center', valign: 'middle',
      lineSpacingMultiple: 1.5, wrap: true,
    });
  }

  // Accent underline
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: (SW - 3.0) / 2, y: CB_Y + 2.60,
    w: 3.0, h: 0.03,
    fill: { color: c(palette.ACC || 'E87722') },
    line: { type: 'none' },
  });

  // Sub message (below accent line)
  if (opts.subMessage) {
    sl.addText(opts.subMessage, {
      x: CB_X + CB_PAD, y: CB_Y + 2.80,
      w: CB_W - CB_PAD * 2, h: 0.80,
      fontSize: 16, fontFace: FN_MD, color: 'CCCCCC',
      align: 'center', valign: 'middle',
      lineSpacingMultiple: 1.4, wrap: true,
    });
  }

  // Bottom badge row (KPI-style, with left vertical bar)
  const badgeCount = badges.length;
  if (badgeCount > 0) {
    const badgeY = CB_Y + CB_H - 1.40;
    const badgeH = 1.20;
    const badgeGap = 0.15;
    const badgeW = (CB_W - CB_PAD * 2 - badgeGap * (badgeCount - 1)) / badgeCount;

    badges.forEach((b, i) => {
      const x = CB_X + CB_PAD + i * (badgeW + badgeGap);

      // Badge bg
      sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x, y: badgeY, w: badgeW, h: badgeH,
        rectRadius: 0.08,
        fill: { color: c(palette.SEC || '1E2A3A') },
        line: { type: 'none' },
        shadow: sdw(),
      });

      // Left vertical bar (AP-21)
      sl.addShape(pptx.shapes.RECTANGLE, {
        x, y: badgeY + 0.10, w: 0.04, h: badgeH - 0.20,
        fill: { color: c(palette.DOM || 'CC0033') },
        line: { type: 'none' },
      });

      // Value text
      sl.addText(b.value || b.num || '', {
        x: x + 0.15, y: badgeY + 0.12, w: badgeW - 0.30, h: 0.50,
        fontSize: 16, fontFace: FN_XB, color: c(palette.ACC || 'E87722'),
        align: 'left', valign: 'middle',
        wrap: false, margin: 0,
      });

      // Label
      sl.addText(b.label || '', {
        x: x + 0.15, y: badgeY + 0.65, w: badgeW - 0.30, h: 0.35,
        fontSize: 12, fontFace: FN_MD, color: 'CCCCCC',
        align: 'left', valign: 'middle',
        wrap: false, margin: 0,
      });
    });
  }

  // Bottom insight bar
  if (insightText) {
    sl.addText(insightText, {
      x: CB_X + CB_PAD, y: CB_Y + CB_H - 0.65,
      w: CB_W - CB_PAD * 2, h: 0.60,
      fontSize: 14, fontFace: FN_XB, color: 'FFFFFF',
      fill: { color: c(palette.DOM || 'CC0033') },
      rectRadius: 0.06,
      align: 'center', valign: 'middle',
      margin: 0,
      line: { type: 'none' },
      shadow: sdw(),
    });
  }
}

// ---- Type B: image-overlay-message ----
function renderImageOverlayMessage(sl, pptx, opts) {
  const { message, subMessage, insightText, palette, bgImage } = opts;

  // Full dark background (or image + overlay)
  sl.background = { fill: c(palette.DK || '0D0D1A') };

  if (bgImage) {
    const imgArg = (bgImage.startsWith('image/') || bgImage.startsWith('data:'))
      ? { data: bgImage } : { path: bgImage };
    sl.addImage({ ...imgArg, x: 0, y: 0, w: SW, h: SH, sizing: { type: 'cover', w: SW, h: SH } });
  }

  // Semi-transparent gradient overlay
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: SW, h: SH,
    fill: {
      type: 'gradient',
      stops: [
        { position: 0, color: '000000', transparency: 80 },
        { position: 50, color: '000000', transparency: 50 },
        { position: 100, color: '000000', transparency: 10 },
      ],
    },
    line: { type: 'none' },
  });

  // Header (white text on dark)
  renderHeader(sl, pptx, { ...opts, darkBg: true });

  // Central large message
  if (message) {
    sl.addText(message, {
      x: CB_X + CB_PAD, y: CB_Y + 0.60,
      w: CB_W - CB_PAD * 2, h: 1.40,
      fontSize: 26, fontFace: FN_XB, color: 'FFFFFF',
      align: 'center', valign: 'middle',
      lineSpacingMultiple: 1.4, wrap: true, margin: 0,
    });
  }

  // Sub-copy
  if (subMessage) {
    sl.addText(subMessage, {
      x: CB_X + 1.0, y: CB_Y + 2.20,
      w: CB_W - 2.0, h: 0.60,
      fontSize: 12, fontFace: FN_TN, color: 'D0D0D0',
      align: 'center', valign: 'middle',
      wrap: true, margin: 0,
    });
  }

  // Bottom insight bar
  if (insightText) {
    sl.addText(insightText, {
      x: CB_X + CB_PAD, y: CB_Y + CB_H - 0.65,
      w: CB_W - CB_PAD * 2, h: 0.60,
      fontSize: 14, fontFace: FN_XB, color: 'FFFFFF',
      fill: { color: c(palette.DOM || 'CC0033') },
      rectRadius: 0.06,
      align: 'center', valign: 'middle',
      margin: 0,
      line: { type: 'none' },
      shadow: sdw(),
    });
  }
}

// ---- Type C: split-impact (DOM bg + hero + pillars) ----
function renderSplitImpact(sl, pptx, opts) {
  const { message, subMessage, pillars = [], insightText, palette } = opts;

  // Full DOM color background
  sl.background = { fill: c(palette.DOM || 'CC0033') };

  // Header (white text on colored bg)
  renderHeader(sl, pptx, { ...opts, darkBg: true });

  // Hero message (center)
  if (message) {
    sl.addText(message, {
      x: CB_X + CB_PAD, y: CB_Y + 0.50,
      w: CB_W - CB_PAD * 2, h: 2.6,
      fontSize: 36, fontFace: FN_XB, color: 'FFFFFF',
      align: 'center', valign: 'middle',
      lineSpacingMultiple: 1.5, wrap: true,
    });
  }

  // Accent line
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: (SW - 3.0) / 2, y: CB_Y + 3.30,
    w: 3.0, h: 0.03,
    fill: { color: 'FFFFFF', transparency: 30 },
    line: { type: 'none' },
  });

  // Sub message
  if (subMessage) {
    sl.addText(subMessage, {
      x: CB_X + CB_PAD, y: CB_Y + 3.55,
      w: CB_W - CB_PAD * 2, h: 0.50,
      fontSize: 14, fontFace: FN_MD, color: 'FFFFFF', transparency: 25,
      align: 'center', valign: 'middle',
      wrap: false, margin: 0,
    });
  }

  // Solution pillars (bottom row, semi-transparent white cards)
  const pillarCount = pillars.length;
  if (pillarCount > 0) {
    const pillY = CB_Y + CB_H - 1.30;
    const pillH = 1.10;
    const pillGap = 0.15;
    const pillW = (CB_W - CB_PAD * 2 - pillGap * (pillarCount - 1)) / pillarCount;

    pillars.forEach((p, i) => {
      const x = CB_X + CB_PAD + i * (pillW + pillGap);

      // Pill bg (semi-transparent white)
      sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x, y: pillY, w: pillW, h: pillH,
        rectRadius: 0.08,
        fill: { color: 'FFFFFF', transparency: 85 },
        line: { type: 'none' },
      });

      // Number/icon
      sl.addText(p.icon || p.num || '', {
        x: x + 0.10, y: pillY + 0.08, w: 0.60, h: 0.38,
        fontSize: 18, fontFace: FN_XB, color: 'FFFFFF',
        align: 'center', valign: 'middle',
        wrap: false, margin: 0,
      });

      // Title
      sl.addText(p.title || '', {
        x: x + 0.10, y: pillY + 0.45, w: pillW - 0.20, h: 0.30,
        fontSize: 12, fontFace: FN_XB, color: 'FFFFFF',
        align: 'left', valign: 'middle',
        wrap: false, margin: 0,
      });

      // Description
      if (p.desc) {
        sl.addText(p.desc, {
          x: x + 0.10, y: pillY + 0.75, w: pillW - 0.20, h: 0.28,
          fontSize: 9, fontFace: FN, color: 'FFFFFF', transparency: 30,
          align: 'left', valign: 'top',
          wrap: false, margin: 0,
        });
      }
    });
  }
}

// ---- Public API ----
/**
 * Create a highlight/emphasis body slide.
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} opts
 * @param {string} opts.type - 'dark-keywords' | 'image-overlay-message' | 'split-impact'
 * @param {string} opts.chapter - Chapter label (e.g. "Ch1. 현황 진단")
 * @param {string} opts.msg - Header headline
 * @param {string} [opts.sub] - Header subtitle
 * @param {string} opts.message - Central hero message
 * @param {string} [opts.subMessage] - Sub-copy below hero
 * @param {Array}  [opts.badges] - (Type A) Array of { value, label }
 * @param {Array}  [opts.pillars] - (Type C) Array of { num, title, desc }
 * @param {string} [opts.insightText] - Bottom insight bar text
 * @param {Object} opts.palette - Color palette
 * @param {string} [opts.bgImage] - Background image (Type B)
 *
 * @example
 * const createHighlightBody = require('./highlight_body');
 * const slide = pptx.addSlide();
 * createHighlightBody(slide, pptx, {
 *   type: 'dark-keywords',
 *   chapter: 'Ch1. 현황 진단',
 *   msg: '핵심 문제 선언',
 *   message: '일관성 없는 서비스,\n통제 불가능한 보안',
 *   subMessage: '이 구조로는 글로벌 위상을 지탱할 수 없습니다',
 *   badges: [
 *     { value: 'G90 vs 카니발', label: '차량 등급 혼재' },
 *     { value: '촬영 사고 발생', label: '보안 관리 부재' },
 *   ],
 *   palette: { DOM: 'CC0033', SEC: '1E2A3A', ACC: 'E87722', DK: '141B24' },
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

// Export sub-renderers for direct access
module.exports.renderDarkKeywords = renderDarkKeywords;
module.exports.renderImageOverlayMessage = renderImageOverlayMessage;
module.exports.renderSplitImpact = renderSplitImpact;
