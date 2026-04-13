/**
 * ending.js - Ending (thank-you) slide pattern components (AP-01~AP-27 compliant)
 *
 * Three ending variants:
 *   Type A "minimal"      - White bg, left-aligned promise + thank-you, gradient shapes
 *   Type B "cinematic"    - Dark bg, left-aligned promise hero + 감사합니다 sub
 *   Type C "brand-color"  - Full DOM color bg, centered promise + brand bar
 *
 * Key design rule (from generate_ppt.js reference):
 *   - Hero text = promise/commitment copy (NOT 감사합니다)
 *   - "감사합니다" = secondary text (smaller, below hero)
 *   - Hero textbox width >= 7" (per Phase 3.5 check #12)
 *
 * AP compliance:
 *   - AP-12: No charSpacing on Korean text
 *   - AP-15: No bold: true (use FN_XB fontFace)
 *   - AP-24: Shadow factory sdw()
 *   - AP-25: margin: 0 only (no array)
 *   - AP-27: wrap: false + margin: 0 on single-line text
 *   - All shapes use line: { type: 'none' }
 *
 * Slide size: 11.69 x 8.27 inches (A4 landscape)
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} opts
 * @param {string} opts.type - "A" | "B" | "C"
 * @param {string} opts.promiseText - Hero promise/commitment text (REQUIRED)
 * @param {string} [opts.thankYouText] - Thank-you text (default: "감사합니다")
 * @param {string} [opts.companyName] - Company name
 * @param {string} [opts.copyright] - Copyright text
 * @param {string} [opts.proposalTitle] - Proposal title for footer
 * @param {Object} opts.palette - { DOM, SEC, ACC, DK, LT, CD, SB, TF }
 * @param {string} [opts.bgImage] - Background image data (Type B)
 */

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN_TN = 'Pretendard Thin';

const SW = 11.69;
const SH = 8.27;

// Shadow factory (AP-24)
const sdw = () => ({ type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 });

module.exports = function createEnding(
  sl,
  pptx,
  { type = 'A', promiseText, thankYouText, companyName, copyright, proposalTitle, palette, bgImage }
) {
  if (!palette) throw new Error('ending: palette is required');
  if (!promiseText) throw new Error('ending: promiseText is required (hero = promise copy, NOT 감사합니다)');

  const tyText = thankYouText || '감사합니다';

  switch (type) {
    case 'B':
      _endingCinematic(sl, pptx, { promiseText, tyText, companyName, copyright, proposalTitle, palette, bgImage });
      break;
    case 'C':
      _endingBrandColor(sl, pptx, { promiseText, tyText, companyName, copyright, proposalTitle, palette });
      break;
    default:
      _endingMinimal(sl, pptx, { promiseText, tyText, companyName, copyright, proposalTitle, palette });
      break;
  }
};

// ---------------------------------------------------------------------------
// Type A  "minimal"
// ---------------------------------------------------------------------------
function _endingMinimal(sl, pptx, { promiseText, tyText, companyName, copyright, palette }) {
  const { DOM, SEC, ACC, DK } = palette;

  sl.background = { fill: 'FFFFFF' };

  // Hero promise text (left-aligned, large)
  sl.addText(promiseText, {
    x: 0.98, y: SH * 0.30, w: SW * 0.55, h: 1.8,
    fontSize: 32, fontFace: FN_XB, color: DK || '1A1A2E',
    align: 'left', valign: 'middle',
    lineSpacingMultiple: 1.4, wrap: true,
  });

  // Decorative line
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0.98, y: SH * 0.30 + 2.0, w: 2.0, h: 0.025,
    fill: { color: ACC || DOM },
    line: { type: 'none' },
  });

  // "감사합니다" (secondary, smaller)
  sl.addText(tyText, {
    x: 0.98, y: SH * 0.30 + 2.30, w: 3.0, h: 0.45,
    fontSize: 14, fontFace: FN_MD, color: '777777',
    align: 'left', valign: 'middle',
    wrap: false, margin: 0,
  });

  // Company name (bottom-left)
  if (companyName) {
    sl.addText(companyName, {
      x: 0.98, y: SH - 0.9, w: 3.5, h: 0.35,
      fontSize: 11, fontFace: FN_MD, color: 'AAAAAA',
      align: 'left', valign: 'middle',
      wrap: false, margin: 0,
    });
  }

  // Abstract gradient shapes at right
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: SW * 0.58, y: SH * 0.15, w: 4.2, h: 4.2,
    rectRadius: 1.0,
    fill: { color: SEC, transparency: 80 },
    line: { type: 'none' },
    rotate: 15,
  });
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.65, y: SH * 0.45, w: 3.2, h: 3.2,
    fill: { color: ACC, transparency: 75 },
    line: { type: 'none' },
  });
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.55, y: SH * 0.60, w: 1.6, h: 1.6,
    fill: { color: DOM, transparency: 85 },
    line: { type: 'none' },
  });
}

// ---------------------------------------------------------------------------
// Type B  "cinematic" (reference: SK hynix ending)
// ---------------------------------------------------------------------------
function _endingCinematic(sl, pptx, { promiseText, tyText, companyName, copyright, palette, bgImage }) {
  const { DOM, SEC, ACC, DK } = palette;

  sl.background = { fill: DK || '0D0D1A' };

  // Background image + overlay (optional)
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

  // Subtle brand tint
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: SW, h: SH,
    fill: { color: DOM, transparency: 90 },
    line: { type: 'none' },
  });

  // Hero promise text (LEFT-ALIGNED, width >= 7")
  sl.addText(promiseText, {
    x: 1.47, y: 3.00, w: 9.0, h: 1.80,
    fontSize: 32, fontFace: FN_XB, color: 'FFFFFF',
    align: 'left', valign: 'middle',
    lineSpacingMultiple: 1.4, wrap: true,
  });

  // Decorative accent line
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 1.47, y: 5.10, w: 2.0, h: 0.025,
    fill: { color: ACC || DOM },
    line: { type: 'none' },
  });

  // "감사합니다" (secondary, 14pt)
  sl.addText(tyText, {
    x: 1.47, y: 5.40, w: 3.0, h: 0.45,
    fontSize: 14, fontFace: FN_MD, color: 'CCCCCC',
    align: 'left', valign: 'middle',
    wrap: false, margin: 0,
  });

  // Copyright
  if (copyright) {
    sl.addText(copyright, {
      x: 1.47, y: 6.30, w: 5.0, h: 0.35,
      fontSize: 12, fontFace: FN_TN, color: '666666',
      align: 'left', valign: 'middle',
      wrap: false, margin: 0,
    });
  }

  // Decorative circles (bottom-right, subtle)
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.65, y: SH * 0.55, w: 3.5, h: 3.5,
    fill: { color: DOM, transparency: 85 },
    line: { type: 'none' },
  });
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.75, y: SH * 0.35, w: 2.5, h: 2.5,
    fill: { color: ACC, transparency: 88 },
    line: { type: 'none' },
  });
}

// ---------------------------------------------------------------------------
// Type C  "brand-color"
// ---------------------------------------------------------------------------
function _endingBrandColor(sl, pptx, { promiseText, tyText, companyName, copyright, proposalTitle, palette }) {
  const { DOM, SEC, DK } = palette;

  sl.background = { fill: DOM };

  // Tone-on-tone pattern (large subtle circles)
  sl.addShape(pptx.shapes.OVAL, {
    x: -2.0, y: -1.5, w: 6.0, h: 6.0,
    fill: { color: 'FFFFFF', transparency: 92 },
    line: { type: 'none' },
  });
  sl.addShape(pptx.shapes.OVAL, {
    x: SW - 4.0, y: SH - 4.5, w: 5.5, h: 5.5,
    fill: { color: '000000', transparency: 92 },
    line: { type: 'none' },
  });
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.55, y: -2.0, w: 3.5, h: 3.5,
    fill: { color: 'FFFFFF', transparency: 95 },
    line: { type: 'none' },
  });

  // Hero promise text (centered, white)
  sl.addText(promiseText, {
    x: 1.5, y: SH * 0.30, w: SW - 3.0, h: 1.8,
    fontSize: 32, fontFace: FN_XB, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    lineSpacingMultiple: 1.4, wrap: true,
  });

  // Accent line
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: (SW - 2.0) / 2, y: SH * 0.30 + 2.0, w: 2.0, h: 0.025,
    fill: { color: 'FFFFFF', transparency: 30 },
    line: { type: 'none' },
  });

  // "감사합니다" (centered, smaller, semi-transparent)
  sl.addText(tyText, {
    x: 2.0, y: SH * 0.30 + 2.30, w: SW - 4.0, h: 0.50,
    fontSize: 16, fontFace: FN_MD, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    transparency: 20,
    wrap: false, margin: 0,
  });

  // Brand bar at bottom
  const barH = 0.6;
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: SH - barH, w: SW, h: barH,
    fill: { color: DK || '000000', transparency: 40 },
    line: { type: 'none' },
  });

  // Company name in brand bar (left)
  if (companyName) {
    sl.addText(companyName, {
      x: 0.8, y: SH - barH, w: 3.5, h: barH,
      fontSize: 11, fontFace: FN_MD, color: 'FFFFFF',
      align: 'left', valign: 'middle',
      transparency: 15,
      wrap: false, margin: 0,
    });
  }

  // Proposal title in brand bar (right)
  if (proposalTitle) {
    sl.addText(proposalTitle, {
      x: SW - 5.0, y: SH - barH, w: 4.2, h: barH,
      fontSize: 10, fontFace: FN_TN, color: 'FFFFFF',
      align: 'right', valign: 'middle',
      transparency: 30,
      wrap: false, margin: 0,
    });
  }
}
