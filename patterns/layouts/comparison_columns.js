/**
 * ===============================================================
 *  comparison_columns.js -- Side-by-side comparison columns
 * ===============================================================
 *
 *  Reference: p.9 (APEC 제안의 차별화) -- 하단 3개 비교 컬럼
 *  (차이점 1/2/3) 얇은 구분선으로 분리, 각각 제목+본문.
 *
 *  기존 card_grid와의 차이:
 *   - card_grid: 카드 배경(fill+shadow)으로 구분
 *   - comparison_columns: 구분선(divider)으로 구분, 배경 없거나 투명
 *
 *  Use cases:
 *   - 차별점/강점 비교
 *   - 옵션 A vs B vs C
 *   - Before/After 대비
 *   - 서비스 구분별 설명
 *
 *  AP compliance: AP-14, AP-15, AP-21, AP-24, AP-25, AP-27
 *  All shapes use line: { type: 'none' }
 */

const { CB_X, CB_Y, CB_W, CB_H } = require('./zone_helper');

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN    = 'Pretendard';

/**
 * Render a single comparison column
 */
function renderColumn(sl, pptx, { x, y, w, h, col, palette, index, style }) {
  const PAD = 0.15;
  let contentY = y + PAD;

  // Optional category label (small, above title)
  if (col.category) {
    sl.addText(col.category, {
      x: x + PAD, y: contentY, w: w - PAD * 2, h: 0.22,
      fontSize: 9, fontFace: FN_MD,
      color: palette.TG || '888888',
      align: 'center', valign: 'middle',
      wrap: false, margin: 0,
    });
    contentY += 0.28;
  }

  // Title
  const titleFs = w > 3.0 ? 18 : w > 2.0 ? 16 : 14;
  const titleColor = col.highlight
    ? (palette.DOM || '2B5797')
    : (palette.TD || '1A1A2E');

  sl.addText(col.title || '', {
    x: x + PAD, y: contentY, w: w - PAD * 2, h: 0.40,
    fontSize: titleFs, fontFace: FN_XB, color: titleColor,
    align: 'center', valign: 'middle',
    wrap: true, margin: 0,
    line: { type: 'none' },
  });
  contentY += 0.48;

  // Short accent line under title
  const lineW = Math.min(w * 0.25, 1.0);
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: x + (w - lineW) / 2, y: contentY,
    w: lineW, h: 0.025,
    fill: { color: col.highlight ? (palette.DOM || '2B5797') : (palette.ACC || palette.DOM || '3366CC') },
    line: { type: 'none' },
  });
  contentY += 0.20;

  // Body text (single block or multiple paragraphs)
  const bodyText = Array.isArray(col.body)
    ? col.body.join('\n\n')
    : (col.body || '');

  if (bodyText) {
    sl.addText(bodyText, {
      x: x + PAD, y: contentY,
      w: w - PAD * 2, h: h - (contentY - y) - PAD,
      fontSize: 11, fontFace: FN, color: palette.TG || '555555',
      align: 'center', valign: 'top',
      wrap: true, lineSpacingMultiple: 1.4, margin: 0,
    });
  }
}

/**
 * Main function: Comparison columns
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} options
 * @param {Array} options.columns - Column data array
 *   [{ title:string, body:string|string[], category?:string, highlight?:boolean }]
 * @param {Object} options.palette - Color palette
 * @param {string} [options.dividerStyle='line'] - 'line'|'none'|'card'
 * @param {Object} [options.zone] - { x, y, w, h } render area
 * @param {boolean} [options.showBackground=false] - Show subtle background per column
 */
function comparisonColumns(sl, pptx, options = {}) {
  const {
    columns = [],
    palette = {},
    dividerStyle = 'line',
    zone,
    showBackground = false,
  } = options;

  if (columns.length === 0) return;

  const z = zone || { x: CB_X, y: CB_Y, w: CB_W, h: CB_H };
  const n = columns.length;
  const dividerGap = 0.08;
  const colW = (z.w - dividerGap * (n - 1)) / n;

  columns.forEach((col, i) => {
    const colX = z.x + i * (colW + dividerGap);

    // Optional background
    if (showBackground) {
      sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: colX, y: z.y, w: colW, h: z.h,
        rectRadius: 0.06,
        fill: { color: palette.CD || 'F8F9FB' },
        line: { type: 'none' },
      });
    }

    // Render column content
    renderColumn(sl, pptx, {
      x: colX, y: z.y, w: colW, h: z.h,
      col, palette, index: i, style: dividerStyle,
    });

    // Vertical divider between columns
    if (dividerStyle === 'line' && i < n - 1) {
      const divX = colX + colW + dividerGap / 2 - 0.005;
      sl.addShape(pptx.shapes.RECTANGLE, {
        x: divX, y: z.y + 0.10,
        w: 0.01, h: z.h - 0.20,
        fill: { color: palette.SB || 'DDDDDD' },
        line: { type: 'none' },
      });
    }
  });
}

module.exports = comparisonColumns;
