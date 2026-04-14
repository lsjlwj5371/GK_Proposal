/**
 * ===============================================================
 *  weighted_grid.js -- Weight-based asymmetric card grid
 * ===============================================================
 *
 *  Reference: p.13 (APEC 과업분석) -- 6개 카드가 비중(%)에 따라
 *  서로 다른 크기로 배치되는 비대칭 그리드.
 *
 *  기존 card_grid.js와의 차이:
 *   - card_grid: 모든 카드 동일 크기 (균등 그리드)
 *   - weighted_grid: 카드별 weight에 비례하여 크기가 달라짐
 *
 *  AP compliance: AP-14, AP-15, AP-21, AP-24, AP-25, AP-27
 *  All shapes use line: { type: 'none' }
 */

const { CB_X, CB_Y, CB_W, CB_H, CB_GAP } = require('./zone_helper');

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN    = 'Pretendard';

// Shadow factory (AP-24)
const sdw = () => ({ type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 });

/**
 * Solve row layout: given items with weights, pack into rows
 * Returns array of rows, each row = array of { item, x, y, w, h }
 *
 * Algorithm:
 *  1. Sort by weight descending
 *  2. Greedily fill rows: total weight per row ~= totalWeight / numRows
 *  3. Within each row, width is proportional to weight
 */
function solveLayout(items, zone, gap, targetRows) {
  if (items.length === 0) return [];

  const totalWeight = items.reduce((s, it) => s + (it.weight || 1), 0);

  // Determine number of rows
  let numRows = targetRows;
  if (!numRows) {
    if (items.length <= 3) numRows = 1;
    else if (items.length <= 6) numRows = 2;
    else numRows = 3;
  }

  // Sort by weight descending for better packing
  const sorted = items.map((item, idx) => ({ ...item, _idx: idx }))
    .sort((a, b) => (b.weight || 1) - (a.weight || 1));

  // Pack into rows greedily
  const rows = Array.from({ length: numRows }, () => []);
  const rowWeights = new Array(numRows).fill(0);

  sorted.forEach(item => {
    // Find the row with least total weight
    let minRow = 0;
    for (let r = 1; r < numRows; r++) {
      if (rowWeights[r] < rowWeights[minRow]) minRow = r;
    }
    rows[minRow].push(item);
    rowWeights[minRow] += (item.weight || 1);
  });

  // Sort items within each row by original index for stable ordering
  rows.forEach(row => row.sort((a, b) => a._idx - b._idx));

  // Calculate dimensions
  const rowH = (zone.h - gap * (numRows - 1)) / numRows;
  const result = [];

  rows.forEach((row, rowIdx) => {
    if (row.length === 0) return;
    const rowTotalWeight = row.reduce((s, it) => s + (it.weight || 1), 0);
    let x = zone.x;
    const y = zone.y + rowIdx * (rowH + gap);

    row.forEach(item => {
      const w = ((item.weight || 1) / rowTotalWeight) * (zone.w - gap * (row.length - 1));
      result.push({ item, x, y, w, h: rowH });
      x += w + gap;
    });
  });

  return result;
}

/**
 * Render a single weighted card (image overlay style with % anchor)
 */
function renderWeightedCard(sl, pptx, { x, y, w, h, item, palette }) {
  const PAD = 0.18;

  // Card background (image placeholder or solid)
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: palette.LT || 'E8E8F0' },
    line: { type: 'none' },
    shadow: sdw(),
  });

  // Image placeholder text
  sl.addText('Image Area', {
    x, y: y + h * 0.3, w, h: 0.25,
    fontSize: 9, fontFace: FN_MD, color: palette.TG || '999999',
    align: 'center', valign: 'middle',
    wrap: false, margin: 0,
  });
  // [IMAGE: item.image description]

  // Color overlay (gradient bottom->top)
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: {
      type: 'gradient',
      stops: [
        { position: 0, color: palette.DOM || '2B2D6B', transparency: 85 },
        { position: 40, color: palette.DOM || '2B2D6B', transparency: 45 },
        { position: 100, color: palette.DOM || '2B2D6B', transparency: 15 },
      ],
      direction: 'down',
    },
    line: { type: 'none' },
  });

  // Percent anchor (large number, bottom-right)
  if (item.percent != null) {
    const pctText = `${item.percent}%`;
    const pctSize = w > 3.5 ? 54 : w > 2.0 ? 40 : 28;
    sl.addText(pctText, {
      x: x + w - (w > 3.5 ? 2.5 : 1.8),
      y: y + h - (pctSize * 1.2 / 72) - 0.2,
      w: w > 3.5 ? 2.2 : 1.5,
      h: pctSize * 1.2 / 72 + 0.1,
      fontSize: pctSize, fontFace: FN_XB, color: 'FFFFFF', transparency: 25,
      align: 'right', valign: 'bottom',
      wrap: false, margin: 0,
    });
  }

  // Title (top-left area)
  const titleSize = w > 3.0 ? 18 : w > 2.0 ? 15 : 13;
  sl.addText(item.title || '', {
    x: x + PAD, y: y + PAD, w: w - PAD * 2, h: 0.40,
    fontSize: titleSize, fontFace: FN_XB, color: 'FFFFFF',
    valign: 'top', wrap: false, margin: 0,
    line: { type: 'none' },
  });

  // Bullet items (below title)
  if (item.bullets && item.bullets.length > 0) {
    const bulletText = item.bullets.join('\n');
    const bulletSize = w > 3.0 ? 12 : w > 2.0 ? 11 : 10;
    const maxBulletH = h - 0.6 - PAD * 2;
    sl.addText(bulletText, {
      x: x + PAD, y: y + PAD + 0.45,
      w: Math.min(w * 0.65, w - PAD * 2),
      h: Math.min(maxBulletH, item.bullets.length * 0.25 + 0.2),
      fontSize: bulletSize, fontFace: FN_XB, color: 'FFFFFF',
      valign: 'top', wrap: true, lineSpacingMultiple: 1.4,
      line: { type: 'none' },
    });
  }
}

/**
 * Render a weighted card with solid background (no image overlay)
 */
function renderSolidWeightedCard(sl, pptx, { x, y, w, h, item, palette }) {
  const PAD = 0.18;

  // Card background
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: item._dark ? (palette.SEC || palette.DOM || '1B2A4A') : (palette.CD || 'F0F2F5') },
    line: { type: 'none' },
    shadow: sdw(),
  });

  const textColor = item._dark ? 'FFFFFF' : (palette.TD || '1A1A2E');
  const subColor = item._dark ? 'CCCCCC' : (palette.TG || '6B7280');

  // Title
  const titleSize = w > 3.0 ? 18 : w > 2.0 ? 15 : 13;
  sl.addText(item.title || '', {
    x: x + PAD, y: y + PAD, w: w - PAD * 2, h: 0.36,
    fontSize: titleSize, fontFace: FN_XB, color: textColor,
    valign: 'top', wrap: false, margin: 0,
    line: { type: 'none' },
  });

  // Bullets
  if (item.bullets && item.bullets.length > 0) {
    const bulletText = item.bullets.join('\n');
    const bulletSize = w > 3.0 ? 12 : 11;
    sl.addText(bulletText, {
      x: x + PAD, y: y + PAD + 0.42,
      w: w - PAD * 2, h: h - PAD * 2 - 0.50,
      fontSize: bulletSize, fontFace: FN_MD, color: subColor,
      valign: 'top', wrap: true, lineSpacingMultiple: 1.35,
      line: { type: 'none' },
    });
  }

  // Percent anchor
  if (item.percent != null) {
    const pctSize = w > 3.5 ? 42 : w > 2.0 ? 32 : 22;
    sl.addText(`${item.percent}%`, {
      x: x + w - (w > 3.5 ? 2.2 : 1.4),
      y: y + h - pctSize * 1.2 / 72 - 0.15,
      w: w > 3.5 ? 2.0 : 1.2,
      h: pctSize * 1.2 / 72 + 0.1,
      fontSize: pctSize, fontFace: FN_XB,
      color: palette.ACC || palette.DOM || '3366CC', transparency: 20,
      align: 'right', valign: 'bottom',
      wrap: false, margin: 0,
    });
  }
}

/**
 * Main function: Weighted asymmetric card grid
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} options
 * @param {Array} options.items - Item data array
 *   [{ title, bullets?:string[], weight:number, percent?:number }]
 *   weight determines relative card size (e.g., 35 gets 35% of row width)
 * @param {Object} options.palette - Color palette
 * @param {string} [options.style='overlay'] - 'overlay'|'solid'
 * @param {number} [options.rows] - Force number of rows (auto if omitted)
 * @param {Object} [options.zone] - { x, y, w, h } render area
 * @param {number} [options.gap=0.10] - Card gap
 */
function weightedGrid(sl, pptx, options = {}) {
  const {
    items = [],
    palette = {},
    style = 'overlay',
    rows: targetRows,
    zone,
    gap = 0.10,
  } = options;

  if (items.length === 0) return;

  const z = zone || { x: CB_X, y: CB_Y, w: CB_W, h: CB_H };
  const layout = solveLayout(items, z, gap, targetRows);

  const render = style === 'solid' ? renderSolidWeightedCard : renderWeightedCard;

  layout.forEach(({ item, x, y, w, h }) => {
    render(sl, pptx, { x, y, w, h, item, palette });
  });
}

module.exports = weightedGrid;
module.exports.solveLayout = solveLayout;
