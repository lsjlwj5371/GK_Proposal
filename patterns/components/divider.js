/**
 * divider.js - Chapter divider slide pattern components
 *
 * Four divider variants based on real PPT examples:
 *   Type A "center"       - White bg, centered chapter number + title, geometric arcs
 *   Type B "sidebar"      - Left DOM color block with chapter info, right title + sub-TOC
 *   Type C "image-split"  - Left image placeholder, right dark bg with chapter info
 *   Type D "brand-graphic"- Full dark bg, left chapter info, right decorative graphic
 *
 * Slide size: 11.69 x 8.27 inches (A4 landscape)
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} opts
 * @param {string} opts.type - "A" | "B" | "C" | "D"
 * @param {number|string} opts.chapterNum - Chapter number (e.g. 1, "01")
 * @param {string} opts.chapterTitle - Chapter title text
 * @param {string[]} [opts.subItems] - Sub-TOC items for sidebar variant
 * @param {Object} opts.palette - { DOM, SEC, ACC, DK, LT, CD, SB, TF }
 * @param {string} [opts.bgImage] - Path/URL for image (Type C)
 */

const FN_XB = "Pretendard ExtraBold";
const FN_MD = "Pretendard Medium";
const FN_TN = "Pretendard Thin";

const SW = 11.69; // slide width  (inches)
const SH = 8.27;  // slide height (inches)

module.exports = function createDivider(
  sl,
  pptx,
  { type = "A", chapterNum, chapterTitle, subItems, palette, bgImage }
) {
  if (!palette) throw new Error("divider: palette is required");
  if (!chapterTitle) throw new Error("divider: chapterTitle is required");

  const numStr = _padNum(chapterNum);

  switch (type) {
    case "B":
      _dividerSidebar(sl, pptx, { numStr, chapterTitle, subItems, palette });
      break;
    case "C":
      _dividerImageSplit(sl, pptx, { numStr, chapterTitle, subItems, palette, bgImage });
      break;
    case "D":
      _dividerBrandGraphic(sl, pptx, { numStr, chapterTitle, subItems, palette });
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

  sl.background = { fill: "FFFFFF" };

  // ── Chapter number - centered large ──
  sl.addText(numStr, {
    x: 0,
    y: SH * 0.25,
    w: SW,
    h: 1.4,
    fontSize: 54,
    fontFace: FN_XB,
    color: SEC,
    align: "center",
    valign: "middle",
  });

  // ── Chapter title - centered below number ──
  sl.addText(chapterTitle, {
    x: 1.5,
    y: SH * 0.25 + 1.5,
    w: SW - 3.0,
    h: 1.0,
    fontSize: 26,
    fontFace: FN_XB,
    color: DK || "1A1A2E",
    align: "center",
    valign: "top",
    lineSpacingMultiple: 1.2,
    wrap: true,
  });

  // ── Geometric arcs at edges (decorative quarter-circles) ──
  const arcColor = SEC;
  const arcSize = 2.8;

  // Top-left arc
  sl.addShape(pptx.shapes.OVAL, {
    x: -arcSize / 2,
    y: -arcSize / 2,
    w: arcSize,
    h: arcSize,
    fill: { color: arcColor, transparency: 88 },
    line: { color: arcColor, width: 1.5, transparency: 60 },
  });

  // Bottom-right arc
  sl.addShape(pptx.shapes.OVAL, {
    x: SW - arcSize / 2,
    y: SH - arcSize / 2,
    w: arcSize,
    h: arcSize,
    fill: { color: arcColor, transparency: 88 },
    line: { color: arcColor, width: 1.5, transparency: 60 },
  });

  // ── Subtle center divider line ──
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: (SW - 1.5) / 2,
    y: SH * 0.25 + 1.35,
    w: 1.5,
    h: 0.025,
    fill: { color: SEC, transparency: 50 },
    line: { width: 0 },
  });
}

// ---------------------------------------------------------------------------
// Type B  "sidebar"
// ---------------------------------------------------------------------------
function _dividerSidebar(sl, pptx, { numStr, chapterTitle, subItems, palette }) {
  const { DOM, DK } = palette;

  sl.background = { fill: "FFFFFF" };

  const sidebarW = SW * 0.28; // ~25-30%

  // ── Left sidebar block (DOM color) ──
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: sidebarW,
    h: SH,
    fill: { color: DOM },
    line: { width: 0 },
  });

  // ── "Chapter" label in sidebar ──
  sl.addText("CHAPTER", {
    x: 0,
    y: SH * 0.28,
    w: sidebarW,
    h: 0.4,
    fontSize: 11,
    fontFace: FN_MD,
    color: "FFFFFF",
    align: "center",
    valign: "middle",
    charSpacing: 300,
    transparency: 30,
  });

  // ── Large number in sidebar ──
  sl.addText(numStr, {
    x: 0,
    y: SH * 0.34,
    w: sidebarW,
    h: 2.0,
    fontSize: 66,
    fontFace: FN_XB,
    color: "FFFFFF",
    align: "center",
    valign: "middle",
  });

  // ── Chapter title on right side ──
  sl.addText(chapterTitle, {
    x: sidebarW + 0.8,
    y: SH * 0.30,
    w: SW - sidebarW - 1.6,
    h: 1.2,
    fontSize: 34,
    fontFace: FN_XB,
    color: DK || "1A1A2E",
    align: "left",
    valign: "middle",
    lineSpacingMultiple: 1.2,
    wrap: true,
  });

  // ── Divider line below title ──
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: sidebarW + 0.8,
    y: SH * 0.30 + 1.3,
    w: SW - sidebarW - 1.6,
    h: 0.02,
    fill: { color: "DDDDDD" },
    line: { width: 0 },
  });

  // ── Sub-TOC items ──
  if (subItems && subItems.length > 0) {
    const startY = SH * 0.30 + 1.6;
    const itemH = 0.48;

    subItems.forEach((item, i) => {
      const yPos = startY + i * itemH;

      // Bullet number
      sl.addText(`${String(i + 1).padStart(2, "0")}`, {
        x: sidebarW + 0.8,
        y: yPos,
        w: 0.45,
        h: itemH,
        fontSize: 12,
        fontFace: FN_XB,
        color: DOM,
        align: "left",
        valign: "middle",
      });

      // Item text
      sl.addText(item, {
        x: sidebarW + 1.3,
        y: yPos,
        w: SW - sidebarW - 2.1,
        h: itemH,
        fontSize: 14,
        fontFace: FN_MD,
        color: "555555",
        align: "left",
        valign: "middle",
      });

      // Divider line between items
      if (i < subItems.length - 1) {
        sl.addShape(pptx.shapes.RECTANGLE, {
          x: sidebarW + 0.8,
          y: yPos + itemH - 0.01,
          w: SW - sidebarW - 1.6,
          h: 0.01,
          fill: { color: "EEEEEE" },
          line: { width: 0 },
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

  // ── Left image area ──
  if (bgImage) {
    const imgArg = (bgImage.startsWith("image/") || bgImage.startsWith("data:")) ? { data: bgImage } : { path: bgImage };
    sl.addImage({
      ...imgArg,
      x: 0,
      y: 0,
      w: imgW,
      h: SH,
      sizing: { type: "cover", w: imgW, h: SH },
    });
  } else {
    // Placeholder
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: imgW,
      h: SH,
      fill: { color: "E8E8E8" },
      line: { width: 0 },
    });
    sl.addText("Image\nPlaceholder", {
      x: 0,
      y: SH * 0.4,
      w: imgW,
      h: 1.2,
      fontSize: 14,
      fontFace: FN_TN,
      color: "AAAAAA",
      align: "center",
      valign: "middle",
    });
  }

  // ── Right dark background ──
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: imgW,
    y: 0,
    w: darkW,
    h: SH,
    fill: { color: DK || "0D0D1A" },
    line: { width: 0 },
  });

  // ── Chapter number (white, right area) ──
  sl.addText(numStr, {
    x: imgW,
    y: SH * 0.28,
    w: darkW,
    h: 1.4,
    fontSize: 52,
    fontFace: FN_XB,
    color: "FFFFFF",
    align: "center",
    valign: "middle",
    transparency: 15,
  });

  // ── Accent line ──
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: imgW + (darkW - 1.8) / 2,
    y: SH * 0.28 + 1.5,
    w: 1.8,
    h: 0.03,
    fill: { color: SEC },
    line: { width: 0 },
  });

  // ── Chapter title (white, right area) ──
  sl.addText(chapterTitle, {
    x: imgW + 0.8,
    y: SH * 0.28 + 1.8,
    w: darkW - 1.6,
    h: 1.2,
    fontSize: 24,
    fontFace: FN_XB,
    color: "FFFFFF",
    align: "center",
    valign: "top",
    lineSpacingMultiple: 1.25,
    wrap: true,
  });
}

// ---------------------------------------------------------------------------
// Type D  "brand-graphic"
// ---------------------------------------------------------------------------
function _dividerBrandGraphic(sl, pptx, { numStr, chapterTitle, palette }) {
  const { DOM, SEC, ACC, DK } = palette;

  // ── Full dark background ──
  sl.background = { fill: DK || "0D0D1A" };

  // ── Left: Chapter number ──
  sl.addText(numStr, {
    x: 0.9,
    y: SH * 0.26,
    w: 2.5,
    h: 1.4,
    fontSize: 56,
    fontFace: FN_XB,
    color: "FFFFFF",
    align: "left",
    valign: "middle",
  });

  // ── Left: accent bar under number ──
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0.9,
    y: SH * 0.26 + 1.5,
    w: 0.6,
    h: 0.04,
    fill: { color: SEC },
    line: { width: 0 },
  });

  // ── Left: Chapter title ──
  sl.addText(chapterTitle, {
    x: 0.9,
    y: SH * 0.26 + 1.8,
    w: SW * 0.45,
    h: 1.2,
    fontSize: 26,
    fontFace: FN_XB,
    color: "FFFFFF",
    align: "left",
    valign: "top",
    lineSpacingMultiple: 1.25,
    wrap: true,
  });

  // ── Right: Large decorative graphic element area ──
  // Overlapping circles to create abstract brand pattern
  const cx = SW * 0.72;
  const cy = SH * 0.42;

  // Large main circle (DOM color, very transparent)
  sl.addShape(pptx.shapes.OVAL, {
    x: cx - 1.8,
    y: cy - 1.8,
    w: 3.6,
    h: 3.6,
    fill: { color: DOM, transparency: 70 },
    line: { width: 0 },
  });

  // Overlapping circle (SEC color)
  sl.addShape(pptx.shapes.OVAL, {
    x: cx - 0.5,
    y: cy - 2.2,
    w: 3.0,
    h: 3.0,
    fill: { color: SEC, transparency: 78 },
    line: { width: 0 },
  });

  // Small accent circle (ACC color)
  sl.addShape(pptx.shapes.OVAL, {
    x: cx + 1.0,
    y: cy + 0.6,
    w: 1.6,
    h: 1.6,
    fill: { color: ACC, transparency: 65 },
    line: { width: 0 },
  });

  // Ring outline (decorative)
  sl.addShape(pptx.shapes.OVAL, {
    x: cx - 2.4,
    y: cy - 0.8,
    w: 2.8,
    h: 2.8,
    fill: { color: "FFFFFF", transparency: 98 },
    line: { color: "FFFFFF", width: 0.8, transparency: 75 },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pad chapter number to 2 digits (e.g. 1 -> "01").
 */
function _padNum(num) {
  if (num == null) return "01";
  const n = typeof num === "string" ? parseInt(num, 10) : num;
  if (isNaN(n)) return String(num);
  return String(n).padStart(2, "0");
}
