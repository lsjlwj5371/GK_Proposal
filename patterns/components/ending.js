/**
 * ending.js - Ending (thank-you) slide pattern components
 *
 * Three ending variants based on real PPT examples:
 *   Type A "minimal"      - White bg, wide-spaced thank-you, gradient shapes at right
 *   Type B "cinematic"    - Dark bg, centered bold thank-you, keyword highlights, image area
 *   Type C "brand-color"  - Full DOM/SEC color bg, tone-on-tone, centered white text
 *
 * All endings share:
 *   - Main thank-you: 32-40pt Bold
 *   - Sub-promise: 14-18pt, 2-3 lines
 *   - Very low content density (70%+ whitespace is intentional)
 *
 * Slide size: 11.69 x 8.27 inches (A4 landscape)
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} opts
 * @param {string} opts.type - "A" | "B" | "C"
 * @param {string} [opts.thankYouText] - Main thank-you text (default: "감사합니다")
 * @param {string} [opts.promiseText] - Sub-promise / closing message (2-3 lines)
 * @param {string} [opts.companyName] - Company name
 * @param {string} [opts.proposalTitle] - Proposal title for footer context
 * @param {Object} opts.palette - { DOM, SEC, ACC, DK, LT, CD, SB, TF }
 * @param {string} [opts.bgImage] - Path/URL for background image (Type B)
 */

const FN_XB = "Pretendard ExtraBold";
const FN_MD = "Pretendard Medium";
const FN_TN = "Pretendard Thin";

const SW = 11.69; // slide width  (inches)
const SH = 8.27;  // slide height (inches)

module.exports = function createEnding(
  sl,
  pptx,
  { type = "A", thankYouText, promiseText, companyName, proposalTitle, palette, bgImage }
) {
  if (!palette) throw new Error("ending: palette is required");

  const tyText = thankYouText || "감사합니다";

  switch (type) {
    case "B":
      _endingCinematic(sl, pptx, { tyText, promiseText, companyName, proposalTitle, palette, bgImage });
      break;
    case "C":
      _endingBrandColor(sl, pptx, { tyText, promiseText, companyName, proposalTitle, palette });
      break;
    default:
      _endingMinimal(sl, pptx, { tyText, promiseText, companyName, proposalTitle, palette });
      break;
  }
};

// ---------------------------------------------------------------------------
// Type A  "minimal"
// ---------------------------------------------------------------------------
function _endingMinimal(sl, pptx, { tyText, promiseText, companyName, proposalTitle, palette }) {
  const { DOM, SEC, ACC, DK } = palette;

  sl.background = { fill: "FFFFFF" };

  // ── Main thank-you text with wide letter spacing, left-centered ──
  const spacedText = _wideSpace(tyText);
  sl.addText(spacedText, {
    x: 0.98,
    y: SH * 0.34,
    w: SW * 0.55,
    h: 1.2,
    fontSize: 36,
    fontFace: FN_XB,
    color: DK || "1A1A2E",
    align: "left",
    valign: "middle",
    charSpacing: 400,
    bold: true,
  });

  // ── Sub-promise text below ──
  if (promiseText) {
    sl.addText(promiseText, {
      x: 0.98,
      y: SH * 0.34 + 1.4,
      w: SW * 0.50,
      h: 1.2,
      fontSize: 15,
      fontFace: FN_MD,
      color: "777777",
      align: "left",
      valign: "top",
      lineSpacingMultiple: 1.6,
      wrap: true,
    });
  }

  // ── Company name (bottom-left) ──
  if (companyName) {
    sl.addText(companyName, {
      x: 0.98,
      y: SH - 0.9,
      w: 3.5,
      h: 0.35,
      fontSize: 11,
      fontFace: FN_MD,
      color: "AAAAAA",
      align: "left",
      valign: "middle",
    });
  }

  // ── Abstract gradient shapes at right (SEC/ACC colors) ──
  // Large rounded rectangle (SEC, semi-transparent)
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: SW * 0.58,
    y: SH * 0.15,
    w: 4.2,
    h: 4.2,
    rectRadius: 1.0,
    fill: { color: SEC, transparency: 80 },
    line: { width: 0 },
    rotate: 15,
    shadow: { type: "outer", blur: 30, offset: 0, opacity: 0.06, color: SEC },
  });

  // Medium circle (ACC, semi-transparent)
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.65,
    y: SH * 0.45,
    w: 3.2,
    h: 3.2,
    fill: { color: ACC, transparency: 75 },
    line: { width: 0 },
    shadow: { type: "outer", blur: 25, offset: 0, opacity: 0.06, color: ACC },
  });

  // Small accent circle (DOM, faint)
  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.55,
    y: SH * 0.60,
    w: 1.6,
    h: 1.6,
    fill: { color: DOM, transparency: 85 },
    line: { width: 0 },
  });
}

// ---------------------------------------------------------------------------
// Type B  "cinematic"
// ---------------------------------------------------------------------------
function _endingCinematic(sl, pptx, { tyText, promiseText, companyName, proposalTitle, palette, bgImage }) {
  const { DOM, SEC, ACC, DK } = palette;

  // ── Background: image + dark overlay, or solid dark ──
  // Use addImage (base64 embed) instead of sl.background (link) to avoid
  // path-resolution failures with Korean / OneDrive paths.
  if (bgImage) {
    sl.background = { fill: DK || "0D0D1A" };
    const imgArg = (bgImage.startsWith("image/") || bgImage.startsWith("data:")) ? { data: bgImage } : { path: bgImage };
    sl.addImage({ ...imgArg, x: 0, y: 0, w: SW, h: SH, sizing: { type: "cover", w: SW, h: SH } });
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: SW,
      h: SH,
      fill: { color: "000000", transparency: 35 },
      line: { width: 0 },
    });
  } else {
    sl.background = { fill: DK || "0D0D1A" };
  }

  // ── (image placeholder removed — was visible artifact in real PPTs) ──

  // ── Main thank-you text - centered, white, bold ──
  // For Korean text, _cinematicSpace returns text as-is (no separators).
  const cinematicText = _cinematicSpace(tyText);
  // Hero textbox: full slide width minus 0.5" padding, taller to allow 2-line wrap
  sl.addText(cinematicText, {
    x: 0.50,
    y: SH * 0.34,
    w: SW - 1.0,
    h: 2.4,
    fontSize: 38,
    fontFace: FN_XB,
    color: "FFFFFF",
    align: "center",
    valign: "middle",
    bold: true,
    lineSpacingMultiple: 1.25,
    wrap: true,
  });

  // ── Sub-message with keyword color highlights ──
  if (promiseText) {
    // Build rich text array: highlight keywords in SEC color
    const richText = _buildHighlightedText(promiseText, SEC);
    sl.addText(richText, {
      x: 1.5,
      y: SH * 0.40 + 1.6,
      w: SW - 3.0,
      h: 1.2,
      fontSize: 15,
      fontFace: FN_MD,
      color: "CCCCCC",
      align: "center",
      valign: "top",
      lineSpacingMultiple: 1.6,
      wrap: true,
    });
  }

  // ── Brand logo placeholder at bottom ──
  if (companyName) {
    // Thin line separator
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: (SW - 3.0) / 2,
      y: SH - 1.5,
      w: 3.0,
      h: 0.015,
      fill: { color: "FFFFFF", transparency: 60 },
      line: { width: 0 },
    });

    sl.addText(companyName, {
      x: (SW - 6.0) / 2,
      y: SH - 1.3,
      w: 6.0,
      h: 0.5,
      fontSize: 13,
      fontFace: FN_MD,
      color: "AAAAAA",
      align: "center",
      valign: "middle",
    });
  }
}

// ---------------------------------------------------------------------------
// Type C  "brand-color"
// ---------------------------------------------------------------------------
function _endingBrandColor(sl, pptx, { tyText, promiseText, companyName, proposalTitle, palette }) {
  const { DOM, SEC, DK } = palette;

  // ── Full DOM/SEC color background ──
  const bgColor = DOM;
  sl.background = { fill: bgColor };

  // ── Tone-on-tone pattern (large subtle circles) ──
  sl.addShape(pptx.shapes.OVAL, {
    x: -2.0,
    y: -1.5,
    w: 6.0,
    h: 6.0,
    fill: { color: "FFFFFF", transparency: 92 },
    line: { width: 0 },
  });

  sl.addShape(pptx.shapes.OVAL, {
    x: SW - 4.0,
    y: SH - 4.5,
    w: 5.5,
    h: 5.5,
    fill: { color: "000000", transparency: 92 },
    line: { width: 0 },
  });

  sl.addShape(pptx.shapes.OVAL, {
    x: SW * 0.55,
    y: -2.0,
    w: 3.5,
    h: 3.5,
    fill: { color: "FFFFFF", transparency: 95 },
    line: { width: 0 },
  });

  // ── Centered white thank-you text ──
  sl.addText(tyText, {
    x: 1.5,
    y: SH * 0.32,
    w: SW - 3.0,
    h: 1.4,
    fontSize: 40,
    fontFace: FN_XB,
    color: "FFFFFF",
    align: "center",
    valign: "middle",
    charSpacing: 400,
    bold: true,
  });

  // ── Resolution sub-message ──
  if (promiseText) {
    sl.addText(promiseText, {
      x: 2.0,
      y: SH * 0.32 + 1.7,
      w: SW - 4.0,
      h: 1.2,
      fontSize: 16,
      fontFace: FN_MD,
      color: "FFFFFF",
      align: "center",
      valign: "top",
      lineSpacingMultiple: 1.6,
      transparency: 20,
      wrap: true,
    });
  }

  // ── Brand bar at bottom ──
  const barH = 0.6;
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: SH - barH,
    w: SW,
    h: barH,
    fill: { color: DK || "000000", transparency: 40 },
    line: { width: 0 },
  });

  // Company name in brand bar (left)
  if (companyName) {
    sl.addText(companyName, {
      x: 0.8,
      y: SH - barH,
      w: 3.5,
      h: barH,
      fontSize: 11,
      fontFace: FN_MD,
      color: "FFFFFF",
      align: "left",
      valign: "middle",
      transparency: 15,
    });
  }

  // Proposal title in brand bar (right)
  if (proposalTitle) {
    sl.addText(proposalTitle, {
      x: SW - 5.0,
      y: SH - barH,
      w: 4.2,
      h: barH,
      fontSize: 10,
      fontFace: FN_TN,
      color: "FFFFFF",
      align: "right",
      valign: "middle",
      transparency: 30,
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect Korean (Hangul) characters in text.
 */
function _hasKorean(text) {
  return /[\u3130-\u318F\uAC00-\uD7AF]/.test(text || "");
}

/**
 * Add wide spacing between characters for "minimal" style.
 * Skipped for Korean text (looks broken with CJK rendering).
 */
function _wideSpace(text) {
  if (!text) return "";
  if (_hasKorean(text)) return text;
  return text.split("").join(" ");
}

/**
 * Add slash separators for "cinematic" style.
 * Skipped for Korean text — Korean characters look fragmented with separators.
 */
function _cinematicSpace(text) {
  if (!text) return "";
  if (_hasKorean(text)) return text;
  return text.split("").join(" / ");
}

/**
 * Build a pptxgenjs rich-text array from promise text.
 * Quoted words ("keyword") or words wrapped in ** are highlighted in the accent color.
 * Falls back to plain text if no special markers found.
 *
 * @param {string} text - Source text, may contain **keyword** markers
 * @param {string} highlightColor - Hex color for highlighted words
 * @returns {Array} pptxgenjs text array or plain string
 */
function _buildHighlightedText(text, highlightColor) {
  if (!text) return "";

  // Check for **keyword** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  if (parts.length <= 1) {
    // No highlight markers found, return plain string
    return text;
  }

  return parts
    .filter((p) => p.length > 0)
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // Highlighted keyword
        return {
          text: part.slice(2, -2),
          options: {
            fontSize: 15,
            fontFace: FN_XB,
            color: highlightColor,
            bold: true,
          },
        };
      }
      // Normal text
      return {
        text: part,
        options: {
          fontSize: 15,
          fontFace: FN_MD,
          color: "CCCCCC",
        },
      };
    });
}
