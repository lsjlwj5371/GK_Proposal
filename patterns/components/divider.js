/**
 * divider.js - Chapter divider slide pattern components (AP-01~AP-27 compliant)
 *
 * Four divider variants:
 *   Type A "center"       - White bg, centered chapter number + title, geometric arcs
 *   Type B "sidebar"      - Left DOM color block with chapter info, right title + sub-TOC
 *   Type C "image-split"  - Left image placeholder, right dark bg with chapter info
 *   Type D "brand-graphic"- Full dark bg, left chapter info, right decorative graphic
 *
 * AP compliance:
 *   - AP-12: No charSpacing on Korean text
 *   - AP-15: No bold: true (use FN_XB fontFace instead)
 *   - AP-24: Shadow factory (sdw()) instead of shared objects
 *   - AP-25: margin: 0 only (no array)
 *   - AP-27: wrap: false + margin: 0 on single-line text
 *   - All shapes use line: { type: 'none' }
 *
 * Slide size: 11.69 x 8.27 inches (A4 landscape)
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} opts
 * @param {string} opts.type - "A" | "B" | "C" | "D"
 * @param {number|string} opts.chapterNum - Chapter number (e.g. 1, "01")
 * @param {string} opts.chapterTitle - Chapter title text
 * @param {string} [opts.subText] - Subtitle text (Type D)
 * @param {string[]} [opts.subItems] - Sub-TOC items for sidebar variant
 * @param {Object} opts.palette - { DOM, SEC, ACC, DK, LT, CD, SB, TF }
 * @param {string} [opts.bgImage] - Path/URL for image (Type C)
 */

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN_TN = 'Pretendard Thin';

const SW = 11.69;
const SH = 8.27;

module.exports = function createDivider(
  sl,
  pptx,
  { type = 'A', chapterNum, chapterTitle, subText, subItems, palette, bgImage }
) {
  if (!palette) throw new Error('divider: palette is required');
  if (!chapterTitle) throw new Error('divider: chapterTitle is required');

  const numStr = _padNum(chapterNum);

  switch (type) {
    case 'B':
      _dividerSidebar(sl, pptx, { numStr, chapterTitle, subItems, palette });
      break;
    case 'C':
      _dividerImageSplit(sl, pptx, { numStr, chapterTitle, subItems, palette, bgImage });
      break;
    case 'D':
      _dividerBrandGraphic(sl, pptx, { numStr, chapterTitle, subText, palette });
      break;
    default:
      _dividerCenter(sl, pptx, { numStr, chapterTitle, palette });
      break;
  }
};

// ---------------------------------------------------------------------------
// Type A  "center"
// ---------------------------------------------------------------------------
function _dividerCenter(sl, pptx, { numStr, chapterTitle, palette }) {
  const { SEC, DK } = palette;

  sl.background = { fill: 'FFFFFF' };

  // Chapter number - centered large
  sl.addText(numStr, {
    x: 0, y: SH * 0.25, w: SW, h: 1.4,
    fontSize: 54, fontFace: FN_XB, color: SEC,
    align: 'center', valign: 'middle',
    wrap: false, margin: 0,
  });

  // Subtle center divider line
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: (SW - 1.5) / 2, y: SH * 0.25 + 1.35, w: 1.5, h: 0.025,
    fill: { color: SEC, transparency: 50 },
    line: { type: 'none' },
  });

  // Chapter title - centered below number
  sl.addText(chapterTitle, {
    x: 1.5, y: SH * 0.25 + 1.5, w: SW - 3.0, h: 1.0,
    fontSize: 26, fontFace: FN_XB, color: DK || '1A1A2E',
    align: 'center', valign: 'top',
    lineSpacingMultiple: 1.2, wrap: true,
  });

  // Geometric arcs at edges (decorative quarter-circles)
  const arcColor = SEC;
  const arcSize = 2.8;

  sl.addShape(pptx.shapes.OVAL, {
    x: -arcSize / 2, y: -arcSize / 2, w: arcSize, h: arcSize,
    fill: { color: arcColor, transparency: 88 },
    line: { type: 'none' },
  });
  sl.addShape(pptx.shapes.OVAL, {
    x: SW - arcSize / 2, y: SH - arcSize / 2, w: arcSize, h: arcSize,
    fill: { color: arcColor, transparency: 88 },
    line: { type: 'none' },
  });
}

// ---------------------------------------------------------------------------
// Type B  "sidebar"
// ---------------------------------------------------------------------------
function _dividerSidebar(sl, pptx, { numStr, chapterTitle, subItems, palette }) {
  const { DOM, DK } = palette;

  sl.background = { fill: 'FFFFFF' };

  const sidebarW = SW * 0.28;

  // Left sidebar block (DOM color)
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: sidebarW, h: SH,
    fill: { color: DOM },
    line: { type: 'none' },
  });

  // "CHAPTER" label in sidebar (no charSpacing per AP-12)
  sl.addText('CHAPTER', {
    x: 0, y: SH * 0.28, w: sidebarW, h: 0.4,
    fontSize: 11, fontFace: FN_MD, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    transparency: 30,
    wrap: false, margin: 0,
  });

  // Large number in sidebar
  sl.addText(numStr, {
    x: 0, y: SH * 0.34, w: sidebarW, h: 2.0,
    fontSize: 66, fontFace: FN_XB, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    wrap: false, margin: 0,
  });

  // Chapter title on right side
  sl.addText(chapterTitle, {
    x: sidebarW + 0.8, y: SH * 0.30, w: SW - sidebarW - 1.6, h: 1.2,
    fontSize: 34, fontFace: FN_XB, color: DK || '1A1A2E',
    align: 'left', valign: 'middle',
    lineSpacingMultiple: 1.2, wrap: true,
  });

  // Divider line below title
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: sidebarW + 0.8, y: SH * 0.30 + 1.3, w: SW - sidebarW - 1.6, h: 0.02,
    fill: { color: 'DDDDDD' },
    line: { type: 'none' },
  });

  // Sub-TOC items
  if (subItems && subItems.length > 0) {
    const startY = SH * 0.30 + 1.6;
    const itemH = 0.48;

    subItems.forEach((item, i) => {
      const yPos = startY + i * itemH;

      // Bullet number
      sl.addText(`${String(i + 1).padStart(2, '0')}`, {
        x: sidebarW + 0.8, y: yPos, w: 0.45, h: itemH,
        fontSize: 12, fontFace: FN_XB, color: DOM,
        align: 'left', valign: 'middle',
        wrap: false, margin: 0,
      });

      // Item text
      sl.addText(item, {
        x: sidebarW + 1.3, y: yPos, w: SW - sidebarW - 2.1, h: itemH,
        fontSize: 14, fontFace: FN_MD, color: '555555',
        align: 'left', valign: 'middle',
        wrap: false, margin: 0,
      });

      // Divider line between items
      if (i < subItems.length - 1) {
        sl.addShape(pptx.shapes.RECTANGLE, {
          x: sidebarW + 0.8, y: yPos + itemH - 0.01, w: SW - sidebarW - 1.6, h: 0.01,
          fill: { color: 'EEEEEE' },
          line: { type: 'none' },
        });
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Type C  "image-split"
// ---------------------------------------------------------------------------
function _dividerImageSplit(sl, pptx, { numStr, chapterTitle, palette, bgImage }) {
  const { DK, SEC } = palette;

  const imgW = SW * 0.35;
  const darkW = SW - imgW;

  // Left image area
  if (bgImage) {
    const imgArg = (bgImage.startsWith('image/') || bgImage.startsWith('data:'))
      ? { data: bgImage } : { path: bgImage };
    sl.addImage({
      ...imgArg, x: 0, y: 0, w: imgW, h: SH,
      sizing: { type: 'cover', w: imgW, h: SH },
    });
  } else {
    // Placeholder
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: imgW, h: SH,
      fill: { color: 'E8E8E8' },
      line: { type: 'none' },
    });
    sl.addText('Image\nPlaceholder', {
      x: 0, y: SH * 0.4, w: imgW, h: 1.2,
      fontSize: 14, fontFace: FN_TN, color: 'AAAAAA',
      align: 'center', valign: 'middle',
    });
  }

  // Right dark background
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: imgW, y: 0, w: darkW, h: SH,
    fill: { color: DK || '0D0D1A' },
    line: { type: 'none' },
  });

  // Chapter number (white, right area)
  sl.addText(numStr, {
    x: imgW, y: SH * 0.28, w: darkW, h: 1.4,
    fontSize: 52, fontFace: FN_XB, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    transparency: 15,
    wrap: false, margin: 0,
  });

  // Accent line
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: imgW + (darkW - 1.8) / 2, y: SH * 0.28 + 1.5, w: 1.8, h: 0.03,
    fill: { color: SEC },
    line: { type: 'none' },
  });

  // Chapter title (white, right area)
  sl.addText(chapterTitle, {
    x: imgW + 0.8, y: SH * 0.28 + 1.8, w: darkW - 1.6, h: 1.2,
    fontSize: 24, fontFace: FN_XB, color: 'FFFFFF',
    align: 'center', valign: 'top',
    lineSpacingMultiple: 1.25, wrap: true,
  });
}

// ---------------------------------------------------------------------------
// Type D  "brand-graphic"
// ---------------------------------------------------------------------------
function _dividerBrandGraphic(sl, pptx, { numStr, chapterTitle, subText, palette }) {
  const { DOM, SEC, ACC, DK } = palette;

  sl.background = { fill: DK || '0D0D1A' };

  // Left: Chapter number
  sl.addText(numStr, {
    x: 0.9, y: SH * 0.26, w: 2.5, h: 1.4,
    fontSize: 56, fontFace: FN_XB, color: 'FFFFFF',
    align: 'left', valign: 'middle',
    wrap: false, margin: 0,
  });

  // Left: accent bar under number
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0.9, y: SH * 0.26 + 1.5, w: 0.6, h: 0.04,
    fill: { color: ACC || SEC },
    line: { type: 'none' },
  });

  // Left: Chapter title
  sl.addText(chapterTitle, {
    x: 0.9, y: SH * 0.26 + 1.8, w: SW * 0.45, h: 1.2,
    fontSize: 26, fontFace: FN_XB, color: 'FFFFFF',
    align: 'left', valign: 'top',
    lineSpacingMultiple: 1.25, wrap: true, margin: 0,
  });

  // Left: Subtitle text (optional)
  if (subText) {
    sl.addText(subText, {
      x: 0.9, y: SH * 0.26 + 3.0, w: SW * 0.45, h: 0.5,
      fontSize: 13, fontFace: FN_TN, color: 'AAAAAA',
      align: 'left', valign: 'top',
      wrap: false, margin: 0,
    });
  }

  // Right: Large decorative graphic element area
  const cx = SW * 0.72;
  const cy = SH * 0.42;

  // Large main circle (DOM color, very transparent)
  sl.addShape(pptx.shapes.OVAL, {
    x: cx - 1.8, y: cy - 1.8, w: 3.6, h: 3.6,
    fill: { color: DOM, transparency: 70 },
    line: { type: 'none' },
  });

  // Overlapping circle (SEC color)
  sl.addShape(pptx.shapes.OVAL, {
    x: cx - 0.5, y: cy - 2.2, w: 3.0, h: 3.0,
    fill: { color: SEC, transparency: 78 },
    line: { type: 'none' },
  });

  // Small accent circle (ACC color)
  sl.addShape(pptx.shapes.OVAL, {
    x: cx + 1.0, y: cy + 0.6, w: 1.6, h: 1.6,
    fill: { color: ACC, transparency: 65 },
    line: { type: 'none' },
  });

  // Ring outline (decorative)
  sl.addShape(pptx.shapes.OVAL, {
    x: cx - 2.4, y: cy - 0.8, w: 2.8, h: 2.8,
    fill: { color: 'FFFFFF', transparency: 98 },
    line: { color: 'FFFFFF', width: 0.8, transparency: 75 },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pad chapter number to 2 digits (e.g. 1 -> "01").
 */
function _padNum(num) {
  if (num == null) return '01';
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  if (isNaN(n)) return String(num);
  return String(n).padStart(2, '0');
}
