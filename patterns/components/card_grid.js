/**
 * ===============================================================
 *  card_grid.js -- Adaptive card grid component (AP-01~AP-27 compliant)
 * ===============================================================
 *
 *  AP compliance:
 *   - AP-14: No emoji characters
 *   - AP-15: No bold: true (use FN_XB fontFace)
 *   - AP-21: No top accent bar -> left vertical bar instead
 *   - AP-24: Shadow factory sdw() (never share shadow objects)
 *   - AP-25: margin: 0 only (no array)
 *   - AP-27: wrap: false + margin: 0 on single-line text
 *   - All shapes use line: { type: 'none' }
 *
 *  Design tokens (from Good Examples):
 *   - Card internal padding: 0.18"
 *   - Card gap: 0.10~0.15"
 *   - Left vertical bar: 0.04" wide, DOM or ACC color
 *   - Rounded corners: rectRadius 0.08"
 *   - Shadow: blur:6, offset:3, opacity:0.15
 */

// Content Box constants
const CB_X = 0.53;
const CB_Y = 1.77;
const CB_W = 10.63;
const CB_H = 5.91;
const CB_PAD = 0.15;
const CB_GAP_DEFAULT = 0.10;

// zone-based layout support
const { DENSITY, inferDensity, assertZoneSize } = require('../layouts/zone_helper');

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN    = 'Pretendard';

// Shadow factory (AP-24)
const sdw = () => ({ type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 });
const sdwHero = () => ({ type: 'outer', blur: 10, offset: 5, angle: 270, color: '000000', opacity: 0.20 });

/**
 * Auto-determine optimal grid from card count
 */
function resolveGrid(n) {
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n === 2) return { cols: 2, rows: 1 };
  if (n === 3) return { cols: 3, rows: 1 };
  if (n === 4) return { cols: 2, rows: 2 };
  if (n <= 6) return { cols: 3, rows: 2 };
  return { cols: 4, rows: 2 };
}

/**
 * Auto-adjust font size based on text length
 */
function adaptFontSize(text, baseSize, minSize) {
  if (!text) return baseSize;
  const len = text.length;
  if (len > 150) return Math.max(minSize, baseSize - 3);
  if (len > 100) return Math.max(minSize, baseSize - 2);
  if (len > 60) return Math.max(minSize, baseSize - 1);
  return baseSize;
}

/**
 * Default style card: light bg, dark text, left vertical bar
 */
function renderDefaultCard(sl, pptx, { x, y, w, h, card, palette }) {
  const PAD = 0.18;
  const titleSize = adaptFontSize(card.title, 18, 14);
  const bodySize = adaptFontSize(card.body, 13, 11);

  // Card background (rounded corners + shadow)
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: palette.CD || 'F0F2F5' },
    line: { type: 'none' },
    shadow: sdw(),
  });

  // AP-21: No accent bar (flat card + shadow only)

  let contentY = y + PAD;

  // Icon area (if provided as base64 PNG data)
  if (card.iconData) {
    sl.addImage({
      data: card.iconData,
      x: x + PAD + 0.08, y: contentY, w: 0.5, h: 0.5,
    });
    contentY += 0.55;
  }

  // Title
  sl.addText(card.title || '', {
    x: x + PAD, y: contentY, w: w - PAD * 2, h: 0.5,
    fontSize: titleSize, fontFace: FN_XB, color: palette.TD || '1A1A2E',
    valign: 'top', wrap: true,
    line: { type: 'none' },
  });
  contentY += 0.55;

  // Thin colored divider line
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: x + PAD, y: contentY, w: 1.2, h: 0.015,
    fill: { color: palette.ACC || palette.DOM || '3366CC' },
    line: { type: 'none' },
  });
  contentY += 0.15;

  // Body text
  if (card.body) {
    sl.addText(card.body, {
      x: x + PAD, y: contentY, w: w - PAD * 2, h: h - (contentY - y) - PAD,
      fontSize: bodySize, fontFace: FN_MD, color: palette.TG || '6B7280',
      valign: 'top', wrap: true, lineSpacingMultiple: 1.4,
      line: { type: 'none' },
    });
  }
}

/**
 * Dark style card: dark bg, light text, left vertical bar
 */
function renderDarkCard(sl, pptx, { x, y, w, h, card, palette }) {
  const PAD = 0.18;
  const titleSize = adaptFontSize(card.title, 18, 14);
  const bodySize = adaptFontSize(card.body, 13, 11);

  // Card background (dark color)
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: palette.SEC || palette.DOM || '1B2A4A' },
    line: { type: 'none' },
    shadow: sdw(),
  });

  // Ghost number (decorative, top-left)
  if (card.ghostNum) {
    sl.addText(card.ghostNum, {
      x: x + 0.08, y: y + 0.05, w: 1.0, h: 0.7,
      fontSize: 32, fontFace: FN_XB, color: 'FFFFFF', transparency: 85,
      align: 'left', valign: 'top',
      wrap: false, margin: 0,
    });
  }

  let contentY = y + (card.ghostNum ? 0.55 : PAD);

  // Icon (with light circle background for contrast on dark card)
  if (card.iconData) {
    sl.addShape(pptx.shapes.OVAL, {
      x: x + PAD, y: contentY, w: 0.55, h: 0.55,
      fill: { color: palette.ACC || '00E5FF', transparency: 80 },
      line: { type: 'none' },
    });
    sl.addImage({
      data: card.iconData,
      x: x + PAD + 0.05, y: contentY + 0.05, w: 0.45, h: 0.45,
    });
    contentY += 0.65;
  }

  // Title
  sl.addText(card.title || '', {
    x: x + PAD, y: contentY, w: w - PAD * 2, h: 0.32,
    fontSize: titleSize > 14 ? 13 : titleSize, fontFace: FN_XB, color: 'FFFFFF',
    valign: 'middle', wrap: false, margin: 0,
    line: { type: 'none' },
  });
  contentY += 0.38;

  // Divider line
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: x + PAD, y: contentY, w: w - PAD * 2 - 0.20, h: 0.015,
    fill: { color: palette.ACC || '00E5FF', transparency: 40 },
    line: { type: 'none' },
  });
  contentY += 0.12;

  // Body
  if (card.body) {
    sl.addText(card.body, {
      x: x + PAD, y: contentY, w: w - PAD * 2, h: h - (contentY - y) - PAD,
      fontSize: bodySize > 12 ? 11 : bodySize, fontFace: FN_MD, color: 'CCCCCC',
      valign: 'top', wrap: true, lineSpacingMultiple: 1.35,
      line: { type: 'none' },
    });
  }
}

/**
 * KPI style card: large number anchor, left vertical bar
 */
function renderKpiCard(sl, pptx, { x, y, w, h, card, palette }) {
  const PAD = 0.18;
  const numberSize = card.number && card.number.length > 5 ? 24 : card.number && card.number.length > 3 ? 28 : 34;

  // Card background
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: palette.CD || 'F0F2F5' },
    line: { type: 'none' },
    shadow: sdw(),
  });

  // AP-21: No accent bar (flat card + shadow only)

  let contentY = y + 0.10;

  // Big number (visual anchor)
  if (card.number) {
    sl.addText(card.number, {
      x: x + 0.20, y: contentY, w: w - 0.35, h: 0.50,
      fontSize: numberSize, fontFace: FN_XB, color: palette.ACC || palette.DOM || '3366CC',
      align: 'left', valign: 'middle',
      wrap: false, margin: 0,
    });
    contentY += 0.52;
  }

  // Title
  sl.addText(card.title || '', {
    x: x + 0.20, y: contentY, w: w - 0.35, h: 0.26,
    fontSize: 13, fontFace: FN_XB, color: palette.TD || '1A1A2E',
    align: 'left', valign: 'middle',
    wrap: false, margin: 0,
  });
  contentY += 0.30;

  // Divider line
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: x + 0.20, y: contentY, w: w - 0.40, h: 0.015,
    fill: { color: palette.SB || 'DDDDDD' },
    line: { type: 'none' },
  });
  contentY += 0.08;

  // Body description
  if (card.body) {
    sl.addText(card.body, {
      x: x + 0.20, y: contentY, w: w - 0.35, h: h - (contentY - y) - PAD,
      fontSize: 10, fontFace: FN_MD, color: palette.TG || '888888',
      align: 'left', valign: 'top',
      lineSpacingMultiple: 1.3, wrap: true,
    });
  }
}

/**
 * Image overlay style card: placeholder bg + gradient overlay + text
 */
function renderImageOverlayCard(sl, pptx, { x, y, w, h, card, palette }) {
  const PAD = 0.18;

  // Image placeholder background
  // [IMAGE: card.image or relevant image]
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: palette.LT || 'E8E8F0' },
    line: { type: 'none' },
  });

  // Placeholder text (AP-14: no emoji)
  sl.addText('Image Area', {
    x, y: y + 0.3, w, h: 0.3,
    fontSize: 9, color: palette.TG || '999999', align: 'center',
    wrap: false, margin: 0,
  });

  // Gradient overlay (bottom->top, opaque->transparent)
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: {
      type: 'gradient',
      stops: [
        { position: 0, color: '000000', transparency: 90 },
        { position: 50, color: '000000', transparency: 50 },
        { position: 100, color: '000000', transparency: 10 },
      ],
      direction: 'down',
    },
    line: { type: 'none' },
  });

  // Bottom text (on the opaque part of overlay)
  const textY = y + h - 1.3;

  sl.addText(card.title || '', {
    x: x + PAD, y: textY, w: w - PAD * 2, h: 0.45,
    fontSize: 17, fontFace: FN_XB, color: 'FFFFFF',
    valign: 'bottom', wrap: true,
  });

  sl.addShape(pptx.shapes.RECTANGLE, {
    x: x + PAD, y: textY + 0.5, w: 1.0, h: 0.03,
    fill: { color: palette.ACC || '00E5FF' },
    line: { type: 'none' },
  });

  if (card.body) {
    sl.addText(card.body, {
      x: x + PAD, y: textY + 0.6, w: w - PAD * 2, h: 0.6,
      fontSize: 11, fontFace: FN_MD, color: 'DDDDDD',
      valign: 'top', wrap: true, lineSpacingMultiple: 1.3,
    });
  }
}

/**
 * Main function: Adaptive card grid
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} options
 * @param {Array} options.cards - Card data array
 *   [{ title, body, number?, ghostNum?, iconData? }]
 * @param {Object} options.palette - Color palette
 * @param {string} [options.style='default'] - 'default'|'dark'|'kpi'|'image-overlay'
 * @param {Object} [options.gridOverride] - { cols, rows } manual override
 * @param {Object} [options.zone] - { x, y, w, h } render area. Defaults to Content Box.
 * @param {string} [options.density] - 'full'|'half'|'third'|'quarter'|'strip'
 * @param {number} [options.gap] - Card gap override
 */
function cardGrid(sl, pptx, options = {}) {
  const {
    cards = [],
    palette = {},
    style = 'default',
    gridOverride,
    zone,
    density: densityKey,
    gap: gapOverride,
  } = options;

  if (cards.length === 0) return;

  // zone default = Content Box full (backward compatible)
  const z = zone || { x: CB_X, y: CB_Y, w: CB_W, h: CB_H };

  // density inference/validation
  const dKey = densityKey || inferDensity(z);
  assertZoneSize(z, dKey);
  const d = DENSITY[dKey];
  const gap = (typeof gapOverride === 'number') ? gapOverride : d.gap;

  const { cols, rows } = gridOverride || resolveGrid(cards.length);

  // Card size calculation (zone-based)
  const cardW = (z.w - gap * (cols - 1)) / cols;
  const cardH = (z.h - gap * (rows - 1)) / rows;

  // Renderer selection
  const renderers = {
    default: renderDefaultCard,
    dark: renderDarkCard,
    kpi: renderKpiCard,
    'image-overlay': renderImageOverlayCard,
  };
  const render = renderers[style] || renderDefaultCard;

  // Render each card (zone-relative coordinates)
  cards.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = z.x + col * (cardW + gap);
    const y = z.y + row * (cardH + gap);

    render(sl, pptx, { x, y, w: cardW, h: cardH, card, palette, density: d });
  });
}

// Export
module.exports = cardGrid;
module.exports.resolveGrid = resolveGrid;
module.exports.CB_X = CB_X;
module.exports.CB_Y = CB_Y;
module.exports.CB_W = CB_W;
module.exports.CB_H = CB_H;
module.exports.CB_GAP = CB_GAP_DEFAULT;
