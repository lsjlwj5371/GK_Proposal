/**
 * cover.js - Cover slide pattern components
 *
 * Two cover variants based on real PPT examples:
 *   Type A "minimal" - White bg, left-aligned title, badge label, gradient circles
 *   Type B "cinematic" - Dark bg, centered white title, date/subtitle, company badge
 *
 * Slide size: 11.69 x 8.27 inches (A4 landscape)
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} opts
 * @param {string} opts.type - "A" (minimal) or "B" (cinematic)
 * @param {string} opts.title - Main title text
 * @param {string} [opts.subtitle] - Subtitle / date line
 * @param {string} [opts.label] - Badge label text (e.g. "Event Proposal")
 * @param {string} [opts.companyName] - Company name
 * @param {string} [opts.date] - Date string
 * @param {Object} opts.palette - { DOM, SEC, ACC, DK, LT, CD, SB, TF }
 * @param {string} [opts.bgImage] - Path/URL for background image (Type B)
 */

const FN_XB = "Pretendard ExtraBold";
const FN_MD = "Pretendard Medium";
const FN_TN = "Pretendard Thin";

const SW = 11.69; // slide width  (inches)
const SH = 8.27;  // slide height (inches)

module.exports = function createCover(
  sl,
  pptx,
  { type = "A", title, subtitle, label, companyName, date, palette, bgImage }
) {
  if (!palette) throw new Error("cover: palette is required");
  if (!title) throw new Error("cover: title is required");

  if (type === "B") {
    _coverCinematic(sl, pptx, { title, subtitle, label, companyName, date, palette, bgImage });
  } else {
    _coverMinimal(sl, pptx, { title, subtitle, label, companyName, date, palette, bgImage });
  }
};

// ---------------------------------------------------------------------------
// Type A  "minimal"
// ---------------------------------------------------------------------------
function _coverMinimal(sl, pptx, { title, subtitle, label, companyName, date, palette }) {
  const { DOM, SEC, ACC, DK } = palette;

  // ── White background ──
  sl.background = { fill: "FFFFFF" };

  // ── Badge-style label (small rounded rect with DOM bg + white text) ──
  if (label) {
    const badgeW = _textWidth(label, 10) + 0.5;
    sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.98,
      y: SH * 0.28,
      w: badgeW,
      h: 0.34,
      rectRadius: 0.17,
      fill: { color: DOM },
      shadow: { type: "outer", blur: 6, offset: 2, opacity: 0.12, color: "000000" },
    });
    sl.addText(label, {
      x: 0.98,
      y: SH * 0.28,
      w: badgeW,
      h: 0.34,
      fontSize: 10,
      fontFace: FN_MD,
      color: "FFFFFF",
      align: "center",
      valign: "middle",
      bold: false,
    });
  }

  // ── Main title - left aligned at ~35% y ──
  sl.addText(title, {
    x: 0.98,
    y: SH * 0.35,
    w: SW * 0.55,
    h: 1.6,
    fontSize: 30,
    fontFace: FN_XB,
    color: DK || "1A1A2E",
    align: "left",
    valign: "top",
    lineSpacingMultiple: 1.25,
    wrap: true,
  });

  // ── Subtitle / date ──
  if (subtitle || date) {
    const subText = subtitle || date || "";
    sl.addText(subText, {
      x: 0.98,
      y: SH * 0.35 + 1.7,
      w: SW * 0.5,
      h: 0.4,
      fontSize: 13,
      fontFace: FN_MD,
      color: "888888",
      align: "left",
      valign: "top",
    });
  }

  // ── Company name (bottom-left, small gray) ──
  if (companyName) {
    sl.addText(companyName, {
      x: 0.98,
      y: SH - 1.0,
      w: 3.0,
      h: 0.4,
      fontSize: 12,
      fontFace: FN_MD,
      color: "999999",
      align: "left",
      valign: "middle",
    });
  }

  // ── Decorative gradient circle - top-right (SEC color, semi-transparent) ──
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.58,
    y: -1.2,
    w: 5.2,
    h: 5.2,
    fill: { color: SEC, transparency: 75 },
    line: { width: 0 },
    shadow: { type: "outer", blur: 40, offset: 0, opacity: 0.08, color: SEC },
  });

  // ── Decorative gradient circle - bottom-center (ACC color, semi-transparent) ──
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.30,
    y: SH * 0.55,
    w: 4.8,
    h: 4.8,
    fill: { color: ACC, transparency: 78 },
    line: { width: 0 },
    shadow: { type: "outer", blur: 40, offset: 0, opacity: 0.08, color: ACC },
  });

  // ── Four corner decorative marks (subtle "+" crosshairs) ──
  const markColor = "DDDDDD";
  const markLen = 0.28;
  const markW = 0.015;
  const corners = [
    { x: 0.45, y: 0.40 },
    { x: SW - 0.45 - markLen, y: 0.40 },
    { x: 0.45, y: SH - 0.40 - markLen },
    { x: SW - 0.45 - markLen, y: SH - 0.40 - markLen },
  ];
  corners.forEach(({ x, y }) => {
    // horizontal bar
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: x,
      y: y + markLen / 2 - markW / 2,
      w: markLen,
      h: markW,
      fill: { color: markColor },
      line: { width: 0 },
    });
    // vertical bar
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: x + markLen / 2 - markW / 2,
      y: y,
      w: markW,
      h: markLen,
      fill: { color: markColor },
      line: { width: 0 },
    });
  });
}

// ---------------------------------------------------------------------------
// Type B  "cinematic"
// ---------------------------------------------------------------------------
function _coverCinematic(sl, pptx, { title, subtitle, label, companyName, date, palette, bgImage }) {
  const { DOM, SEC, DK } = palette;

  // ── Background: image + dark overlay, or solid dark ──
  // Use addImage (base64 embed) instead of sl.background (link) to avoid
  // path-resolution failures with Korean / OneDrive paths.
  if (bgImage) {
    sl.background = { fill: DK || "0D0D1A" };
    const imgArg = (bgImage.startsWith("image/") || bgImage.startsWith("data:")) ? { data: bgImage } : { path: bgImage };
    sl.addImage({ ...imgArg, x: 0, y: 0, w: SW, h: SH, sizing: { type: "cover", w: SW, h: SH } });
    // Dark overlay
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: SW,
      h: SH,
      fill: { color: DK || "0D0D1A", transparency: 30 },
      line: { width: 0 },
    });
  } else {
    sl.background = { fill: DK || "0D0D1A" };
  }

  // ── Optional label badge (top-center) ──
  if (label) {
    const badgeW = _textWidth(label, 11) + 0.6;
    sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: (SW - badgeW) / 2,
      y: SH * 0.24,
      w: badgeW,
      h: 0.36,
      rectRadius: 0.18,
      fill: { color: DOM, transparency: 20 },
      line: { color: "FFFFFF", width: 0.5, transparency: 50 },
    });
    sl.addText(label, {
      x: (SW - badgeW) / 2,
      y: SH * 0.24,
      w: badgeW,
      h: 0.36,
      fontSize: 11,
      fontFace: FN_MD,
      color: "FFFFFF",
      align: "center",
      valign: "middle",
    });
  }

  // ── Main title - centered ──
  sl.addText(title, {
    x: 1.2,
    y: SH * 0.34,
    w: SW - 2.4,
    h: 2.0,
    fontSize: 28,
    fontFace: FN_XB,
    color: "FFFFFF",
    align: "center",
    valign: "middle",
    lineSpacingMultiple: 1.3,
    wrap: true,
  });

  // ── Date / subtitle below title ──
  if (subtitle || date) {
    const line = [subtitle, date].filter(Boolean).join("  |  ");
    sl.addText(line, {
      x: 1.5,
      y: SH * 0.34 + 2.1,
      w: SW - 3.0,
      h: 0.5,
      fontSize: 14,
      fontFace: FN_MD,
      color: "CCCCCC",
      align: "center",
      valign: "top",
    });
  }

  // ── Thin decorative horizontal line (SEC accent) ──
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: (SW - 2.5) / 2,
    y: SH * 0.34 + 2.7,
    w: 2.5,
    h: 0.02,
    fill: { color: SEC, transparency: 40 },
    line: { width: 0 },
  });

  // ── Company name badge at bottom ──
  if (companyName) {
    const cBadgeW = _textWidth(companyName, 12) + 0.8;
    sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: (SW - cBadgeW) / 2,
      y: SH - 1.2,
      w: cBadgeW,
      h: 0.44,
      rectRadius: 0.22,
      fill: { color: "000000", transparency: 50 },
      line: { color: "FFFFFF", width: 0.4, transparency: 70 },
    });
    sl.addText(companyName, {
      x: (SW - cBadgeW) / 2,
      y: SH - 1.2,
      w: cBadgeW,
      h: 0.44,
      fontSize: 12,
      fontFace: FN_MD,
      color: "FFFFFF",
      align: "center",
      valign: "middle",
    });
  }

  // ── (placeholder dashed rect removed — was visible artifact in real PPTs) ──
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Rough text width estimator (inches) for badge sizing.
 * Korean (CJK) characters are ~1.4× wider than ASCII at the same font size.
 * Returns padding-inclusive badge width.
 */
function _textWidth(text, fontSize) {
  if (!text) return 1.0;
  let units = 0;
  for (const ch of text) {
    // CJK Unified, Hangul Syllables, Hangul Jamo, CJK Symbols
    if (/[\u3000-\u303F\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF\uFF00-\uFFEF]/.test(ch)) {
      units += 1.4;
    } else {
      units += 0.55;
    }
  }
  const charWidth = 0.075 * (fontSize / 10);
  return Math.max(units * charWidth, 0.8);
}
