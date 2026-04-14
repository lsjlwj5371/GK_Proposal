/**
 * cover.js - Cover slide pattern components (AP-01~AP-29 compliant)
 * -----------------------------------------------------------------
 * Two cover variants:
 *   Type A "fullbleed"  - Full background image + DOM gradient overlay + BIFF text
 *   Type B "split"      - Left text (45%) + right image (55%), vertical split
 *
 * Both types accept an optional bgImage parameter:
 *   - bgImage provided  -> image is placed (full cover or right panel)
 *   - bgImage omitted   -> Type A: solid DOM bg / Type B: DOM fill on right
 *
 * BIFF format: x=0.57 left-aligned, hero=copywrite tagline (42pt),
 *              sub=proposal description (14pt)
 *
 * Slide size: 11.69 x 8.27 inches (A4 landscape)
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} opts
 * @param {string} opts.type - "A" (fullbleed) or "B" (split)
 * @param {string} opts.title - Hero tagline text (copywrite, NOT proposal title)
 * @param {string} [opts.subtitle] - Proposal description
 * @param {string} [opts.label] - Badge label text
 * @param {string} [opts.companyName] - Company name
 * @param {string} [opts.date] - Date string
 * @param {Object} opts.palette - { DOM, SEC, ACC, DK, LT, CD, SB, TF }
 * @param {string} [opts.bgImage] - Background image path or base64 data
 */

'use strict';

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN_TN = 'Pretendard Thin';

const SW = 11.69;
const SH = 8.27;

// Shadow factory (AP-24)
const sdw = () => ({ type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 });

module.exports = function createCover(sl, pptx, opts) {
  if (!opts.palette) throw new Error('cover: palette is required');
  if (!opts.title) throw new Error('cover: title is required');

  if (opts.type === 'B') {
    _coverSplit(sl, pptx, opts);
  } else {
    _coverFullbleed(sl, pptx, opts);
  }
};

// ---------------------------------------------------------------------------
// Type A  "fullbleed" — full background image + gradient overlay
// ---------------------------------------------------------------------------
function _coverFullbleed(sl, pptx, { title, subtitle, label, companyName, date, palette, bgImage }) {
  const { DOM } = palette;

  if (bgImage) {
    // Full-cover image
    sl.background = { fill: 'FFFFFF' };
    const imgArg = _imgArg(bgImage);
    sl.addImage({
      ...imgArg, x: 0, y: 0, w: SW, h: SH,
      sizing: { type: 'cover', w: SW, h: SH },
    });

    // Left-to-right gradient overlay (DOM-based)
    // Left side opaque for text readability, right side transparent for image
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: SW, h: SH,
      fill: {
        type: 'gradient',
        angle: 0,
        stops: [
          { position: 0,   color: DOM || '1A1A2E', transparency: 2 },
          { position: 35,  color: DOM || '1A1A2E', transparency: 10 },
          { position: 60,  color: DOM || '1A1A2E', transparency: 55 },
          { position: 100, color: DOM || '1A1A2E', transparency: 92 },
        ],
      },
      line: { type: 'none' },
    });
  } else {
    // Fallback: solid DOM background (no image)
    sl.background = { fill: DOM || '1A1A2E' };
  }

  // Text always white on fullbleed (dark overlay or solid DOM)
  _renderText(sl, pptx, {
    title, subtitle, label, companyName, date, palette,
    darkBg: true,
  });
}

// ---------------------------------------------------------------------------
// Type B  "split" — left text (45%) + right image (55%)
// ---------------------------------------------------------------------------
function _coverSplit(sl, pptx, { title, subtitle, label, companyName, date, palette, bgImage }) {
  const { DOM } = palette;
  const splitX = SW * 0.45;   // 5.26"
  const imgW   = SW - splitX; // 6.43"

  sl.background = { fill: 'FFFFFF' };

  // Right panel: image or solid DOM
  if (bgImage) {
    const imgArg = _imgArg(bgImage);
    sl.addImage({
      ...imgArg, x: splitX, y: 0, w: imgW, h: SH,
      sizing: { type: 'cover', w: imgW, h: SH },
    });
  } else {
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: splitX, y: 0, w: imgW, h: SH,
      fill: { color: DOM || '1A1A2E' },
      line: { type: 'none' },
    });
  }

  // Vertical divider line (thin DOM-colored)
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: splitX - 0.015, y: 0, w: 0.03, h: SH,
    fill: { color: DOM || '1A1A2E', transparency: 30 },
    line: { type: 'none' },
  });

  // Text on white left side
  _renderText(sl, pptx, {
    title, subtitle, label, companyName, date, palette,
    darkBg: false,
    maxTextW: splitX - 0.57 - 0.30,
  });
}

// ---------------------------------------------------------------------------
// Shared text renderer (BIFF left-aligned)
// ---------------------------------------------------------------------------
function _renderText(sl, pptx, { title, subtitle, label, companyName, date, palette, darkBg, maxTextW }) {
  const { DOM, DK } = palette;
  const textW = maxTextW || SW * 0.55;

  // Color scheme based on background
  const heroColor = darkBg ? 'FFFFFF' : (DK || '1A1A2E');
  const subColor  = darkBg ? 'CCCCCC' : '888888';
  const compColor = darkBg ? 'AAAAAA' : '999999';

  // Badge label (BIFF: x=0.57)
  if (label) {
    const badgeW = _textWidth(label, 10) + 0.5;
    sl.addText(label, {
      x: 0.57, y: 2.43, w: badgeW, h: 0.34,
      fontSize: 10, fontFace: FN_MD, color: 'FFFFFF',
      fill: { color: DOM || '1A1A2E', transparency: 15 },
      rectRadius: 0.17, align: 'center', valign: 'middle',
      line: { type: 'none' },
      wrap: false, margin: 0,
    });
  }

  // Hero tagline (BIFF: x=0.57, 42pt ExtraBold)
  sl.addText(title, {
    x: 0.57, y: 2.91, w: textW, h: 1.8,
    fontSize: 42, fontFace: FN_XB,
    color: heroColor,
    align: 'left', valign: 'top',
    lineSpacingMultiple: 1.25, wrap: true,
  });

  // Subtitle / proposal description (BIFF: 14pt Thin)
  if (subtitle || date) {
    sl.addText(subtitle || date || '', {
      x: 0.57, y: 4.83, w: textW, h: 0.5,
      fontSize: 14, fontFace: FN_TN,
      color: subColor,
      align: 'left', valign: 'top',
      wrap: false, margin: 0,
    });
  }

  // Decorative line above company
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0.57, y: SH - 1.5, w: 2.0, h: 0.02,
    fill: { color: DOM || '1A1A2E', transparency: 40 },
    line: { type: 'none' },
  });

  // Company name (BIFF: bottom-left)
  if (companyName) {
    sl.addText(companyName, {
      x: 0.57, y: SH - 1.1, w: 3.5, h: 0.40,
      fontSize: 12, fontFace: FN_MD,
      color: compColor,
      align: 'left', valign: 'middle',
      wrap: false, margin: 0,
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve image argument for pptxgenjs (base64 data vs file path) */
function _imgArg(bgImage) {
  if (bgImage.startsWith('data:') || bgImage.startsWith('image/')) {
    return { data: bgImage };
  }
  return { path: bgImage };
}

/**
 * Rough text width estimator (inches) for badge sizing.
 * Korean (CJK) characters are ~1.4x wider than ASCII at the same font size.
 */
function _textWidth(text, fontSize) {
  if (!text) return 1.0;
  let units = 0;
  for (const ch of text) {
    if (/[\u3000-\u303F\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF\uFF00-\uFFEF]/.test(ch)) {
      units += 1.4;
    } else {
      units += 0.78;
    }
  }
  const charWidth = 0.075 * (fontSize / 10);
  return Math.max(units * charWidth, 0.8);
}
