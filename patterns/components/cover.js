/**
 * cover.js - Cover slide pattern components (AP-01~AP-27 compliant)
 *
 * Two cover variants:
 *   Type A "minimal" - White bg, BIFF left-aligned title, badge label, gradient circles
 *   Type B "cinematic" - Dark bg, BIFF left-aligned title, brand graphic circles
 *
 * BIFF format: x=0.57 left-aligned, hero=copywrite tagline (42pt),
 *              sub=proposal description (14pt)
 *
 * Slide size: 11.69 x 8.27 inches (A4 landscape)
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} opts
 * @param {string} opts.type - "A" (minimal) or "B" (cinematic)
 * @param {string} opts.title - Hero tagline text (copywrite, NOT proposal title)
 * @param {string} [opts.subtitle] - Proposal description (e.g. "XX 서비스 제안")
 * @param {string} [opts.label] - Badge label text (e.g. "VIP Protocol Proposal")
 * @param {string} [opts.companyName] - Company name
 * @param {string} [opts.date] - Date string
 * @param {Object} opts.palette - { DOM, SEC, ACC, DK, LT, CD, SB, TF }
 * @param {string} [opts.bgImage] - Base64 data for background image (Type B)
 */

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN_TN = 'Pretendard Thin';

const SW = 11.69;
const SH = 8.27;

// Shadow factories (AP-24: never share shadow objects)
const sdw = () => ({ type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 });

module.exports = function createCover(
  sl,
  pptx,
  { type = 'A', title, subtitle, label, companyName, date, palette, bgImage }
) {
  if (!palette) throw new Error('cover: palette is required');
  if (!title) throw new Error('cover: title is required');

  if (type === 'B') {
    _coverCinematic(sl, pptx, { title, subtitle, label, companyName, date, palette, bgImage });
  } else {
    _coverMinimal(sl, pptx, { title, subtitle, label, companyName, date, palette, bgImage });
  }
};

// ---------------------------------------------------------------------------
// Type A  "minimal" (BIFF left-aligned)
// ---------------------------------------------------------------------------
function _coverMinimal(sl, pptx, { title, subtitle, label, companyName, date, palette }) {
  const { DOM, SEC, ACC, DK } = palette;

  sl.background = { fill: 'FFFFFF' };

  // -- Decorative gradient circles (behind text, rendered first) --
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.58, y: -1.2, w: 5.2, h: 5.2,
    fill: { color: SEC, transparency: 75 },
    line: { type: 'none' },
  });
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.30, y: SH * 0.55, w: 4.8, h: 4.8,
    fill: { color: ACC, transparency: 78 },
    line: { type: 'none' },
  });

  // -- Badge label (BIFF: x=0.57) --
  if (label) {
    const badgeW = _textWidth(label, 10) + 0.5;
    sl.addText(label, {
      x: 0.57, y: 2.43, w: badgeW, h: 0.34,
      fontSize: 10, fontFace: FN_MD, color: 'FFFFFF',
      fill: { color: DOM, transparency: 15 },
      rectRadius: 0.17, align: 'center', valign: 'middle',
      line: { type: 'none' },
      wrap: false, margin: 0,
    });
  }

  // -- Hero tagline (BIFF: x=0.57, 42pt ExtraBold) --
  sl.addText(title, {
    x: 0.57, y: 2.91, w: SW * 0.55, h: 1.8,
    fontSize: 42, fontFace: FN_XB,
    color: DK || '1A1A2E',
    align: 'left', valign: 'top',
    lineSpacingMultiple: 1.25, wrap: true,
  });

  // -- Subtitle / proposal description (BIFF: 14pt Thin) --
  if (subtitle || date) {
    const subText = subtitle || date || '';
    sl.addText(subText, {
      x: 0.57, y: 4.83, w: SW * 0.55, h: 0.5,
      fontSize: 14, fontFace: FN_TN,
      color: '888888',
      align: 'left', valign: 'top',
      wrap: false, margin: 0,
    });
  }

  // -- Decorative line above company --
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0.57, y: SH - 1.5, w: 2.0, h: 0.02,
    fill: { color: DOM, transparency: 40 },
    line: { type: 'none' },
  });

  // -- Company name (BIFF: bottom-left) --
  if (companyName) {
    sl.addText(companyName, {
      x: 0.57, y: SH - 1.1, w: 3.5, h: 0.40,
      fontSize: 12, fontFace: FN_MD,
      color: '999999',
      align: 'left', valign: 'middle',
      wrap: false, margin: 0,
    });
  }
}

// ---------------------------------------------------------------------------
// Type B  "cinematic" (BIFF left-aligned, dark bg)
// ---------------------------------------------------------------------------
function _coverCinematic(sl, pptx, { title, subtitle, label, companyName, date, palette, bgImage }) {
  const { DOM, SEC, ACC, DK } = palette;

  // -- Background: image + dark overlay, or solid dark --
  sl.background = { fill: DK || '0D0D1A' };
  if (bgImage) {
    const imgArg = (bgImage.startsWith('image/') || bgImage.startsWith('data:'))
      ? { data: bgImage } : { path: bgImage };
    sl.addImage({ ...imgArg, x: 0, y: 0, w: SW, h: SH, sizing: { type: 'cover', w: SW, h: SH } });
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: SW, h: SH,
      fill: { color: '000000', transparency: 35 },
      line: { type: 'none' },
    });
  }

  // -- Decorative brand graphic circles (right side) --
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.55, y: -1.5, w: 5.5, h: 5.5,
    fill: { color: DOM, transparency: 75 },
    line: { type: 'none' },
  });
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.65, y: SH * 0.45, w: 4.0, h: 4.0,
    fill: { color: SEC, transparency: 80 },
    line: { type: 'none' },
  });
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.75, y: SH * 0.20, w: 2.5, h: 2.5,
    fill: { color: ACC, transparency: 70 },
    line: { type: 'none' },
  });

  // -- Badge label (BIFF: x=0.57) --
  if (label) {
    const badgeW = _textWidth(label, 10) + 0.5;
    sl.addText(label, {
      x: 0.57, y: 2.43, w: badgeW, h: 0.34,
      fontSize: 10, fontFace: FN_MD, color: 'FFFFFF',
      fill: { color: DOM, transparency: 15 },
      rectRadius: 0.17, align: 'center', valign: 'middle',
      line: { type: 'none' },
      wrap: false, margin: 0,
    });
  }

  // -- Hero tagline (BIFF: x=0.57, 42pt, white) --
  sl.addText(title, {
    x: 0.57, y: 2.91, w: SW * 0.55, h: 1.8,
    fontSize: 42, fontFace: FN_XB, color: 'FFFFFF',
    align: 'left', valign: 'top',
    lineSpacingMultiple: 1.25, wrap: true,
  });

  // -- Subtitle / proposal description (BIFF: 14pt) --
  if (subtitle || date) {
    const subText = subtitle || date || '';
    sl.addText(subText, {
      x: 0.57, y: 4.83, w: SW * 0.55, h: 0.5,
      fontSize: 14, fontFace: FN_TN, color: 'CCCCCC',
      align: 'left', valign: 'top',
      wrap: false, margin: 0,
    });
  }

  // -- Decorative line (above company) --
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0.57, y: SH - 1.5, w: 2.0, h: 0.02,
    fill: { color: DOM, transparency: 40 },
    line: { type: 'none' },
  });

  // -- Company name (BIFF: bottom-left) --
  if (companyName) {
    sl.addText(companyName, {
      x: 0.57, y: SH - 1.1, w: 3.5, h: 0.40,
      fontSize: 12, fontFace: FN_MD, color: 'AAAAAA',
      align: 'left', valign: 'middle',
      wrap: false, margin: 0,
    });
  }

  // -- Bottom-left subtle decorative circle --
  sl.addShape(pptx.shapes.OVAL, {
    x: -1.5, y: SH * 0.6, w: 4.0, h: 4.0,
    fill: { color: ACC, transparency: 85 },
    line: { type: 'none' },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
      units += 0.55;
    }
  }
  const charWidth = 0.075 * (fontSize / 10);
  return Math.max(units * charWidth, 0.8);
}
