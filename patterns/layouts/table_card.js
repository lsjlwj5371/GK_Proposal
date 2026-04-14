/**
 * ===============================================================
 *  table_card.js -- Table-style card rows (label + content)
 * ===============================================================
 *
 *  Reference: p.41 (APEC 수행방안) -- 우측 5행의 테이블형 카드.
 *  좌측에 색상 라벨(데이터보안, 소프트웨어 등), 우측에 불릿 텍스트.
 *
 *  Use cases:
 *   - 보안/기술 항목별 대응 방안
 *   - 서비스 카테고리별 내용 정리
 *   - 체크리스트/항목별 설명
 *
 *  AP compliance: AP-14, AP-15, AP-21, AP-24, AP-25, AP-27
 *  All shapes use line: { type: 'none' }
 */

const { CB_X, CB_Y, CB_W, CB_H, CB_GAP } = require('./zone_helper');

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN    = 'Pretendard';

const sdw = () => ({ type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 });

/**
 * Auto-cycle label colors for visual variety
 */
function getLabelColor(palette, index) {
  const colors = [
    palette.DOM || '2B5797',
    palette.SEC || '4472C4',
    palette.ACC || '00B0F0',
    palette.DOM || '2B5797',
    palette.SEC || '4472C4',
  ];
  return colors[index % colors.length];
}

/**
 * Render a single table row: [color label] [content text]
 */
function renderTableRow(sl, pptx, { x, y, w, h, row, palette, index, labelWidth }) {
  const PAD = 0.12;
  const lw = labelWidth || 1.10;
  const contentX = x + lw + 0.12;
  const contentW = w - lw - 0.24;

  // Label badge (colored background + white text)
  const labelColor = row.labelColor || getLabelColor(palette, index);
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y: y + 0.03, w: lw, h: h - 0.06,
    rectRadius: 0.06,
    fill: { color: labelColor },
    line: { type: 'none' },
  });

  // Label text
  const labelFs = row.label && row.label.length > 5 ? 11 : 13;
  sl.addText(row.label || '', {
    x, y: y + 0.03, w: lw, h: h - 0.06,
    fontSize: labelFs, fontFace: FN_XB, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    wrap: true, margin: 0,
  });

  // Content area background (subtle)
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: contentX - 0.06, y, w: contentW + 0.12, h,
    rectRadius: 0.04,
    fill: { color: palette.CD || 'F5F7FA' },
    line: { type: 'none' },
  });

  // Content text (bullets)
  const contentText = Array.isArray(row.content)
    ? row.content.map(c => `  ${c}`).join('\n')
    : (row.content || '');

  sl.addText(contentText, {
    x: contentX, y, w: contentW, h,
    fontSize: 11, fontFace: FN_MD, color: palette.TD || '333333',
    valign: 'middle', wrap: true,
    lineSpacingMultiple: 1.35, margin: 0,
  });
}

/**
 * Render a table row with icon (no label badge)
 */
function renderIconRow(sl, pptx, { x, y, w, h, row, palette, index }) {
  const iconSize = 0.45;
  const contentX = x + iconSize + 0.20;
  const contentW = w - iconSize - 0.30;

  // Row background
  const bgColor = index % 2 === 0 ? (palette.CD || 'F5F7FA') : 'FFFFFF';
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.04,
    fill: { color: bgColor },
    line: { type: 'none' },
  });

  // Icon circle
  sl.addShape(pptx.shapes.OVAL, {
    x: x + 0.08, y: y + (h - iconSize) / 2,
    w: iconSize, h: iconSize,
    fill: { color: palette.ACC || palette.DOM || '3366CC', transparency: 85 },
    line: { type: 'none' },
  });

  // Icon placeholder text
  const iconLabel = row.icon || String(index + 1).padStart(2, '0');
  sl.addText(iconLabel, {
    x: x + 0.08, y: y + (h - iconSize) / 2,
    w: iconSize, h: iconSize,
    fontSize: 10, fontFace: FN_XB,
    color: palette.ACC || palette.DOM || '3366CC',
    align: 'center', valign: 'middle',
    wrap: false, margin: 0,
  });

  // Title
  sl.addText(row.label || '', {
    x: contentX, y: y + 0.06, w: contentW, h: 0.28,
    fontSize: 13, fontFace: FN_XB, color: palette.TD || '1A1A2E',
    valign: 'middle', wrap: false, margin: 0,
    line: { type: 'none' },
  });

  // Content
  const contentText = Array.isArray(row.content)
    ? row.content.join('\n')
    : (row.content || '');

  if (contentText) {
    sl.addText(contentText, {
      x: contentX, y: y + 0.36, w: contentW, h: h - 0.42,
      fontSize: 10, fontFace: FN_MD, color: palette.TG || '6B7280',
      valign: 'top', wrap: true,
      lineSpacingMultiple: 1.3, margin: 0,
    });
  }
}

/**
 * Main function: Table card rows
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} options
 * @param {Array} options.rows - Row data array
 *   [{ label:string, content:string|string[], labelColor?:string, icon?:string }]
 * @param {Object} options.palette - Color palette
 * @param {string} [options.style='badge'] - 'badge'|'icon'
 * @param {Object} [options.zone] - { x, y, w, h } render area
 * @param {number} [options.gap=0.08] - Row gap
 * @param {number} [options.labelWidth=1.10] - Label badge width (badge style only)
 */
function tableCard(sl, pptx, options = {}) {
  const {
    rows = [],
    palette = {},
    style = 'badge',
    zone,
    gap = 0.08,
    labelWidth,
  } = options;

  if (rows.length === 0) return;

  const z = zone || { x: CB_X, y: CB_Y, w: CB_W, h: CB_H };
  const n = rows.length;
  const rowH = (z.h - gap * (n - 1)) / n;

  rows.forEach((row, i) => {
    const y = z.y + i * (rowH + gap);

    if (style === 'icon') {
      renderIconRow(sl, pptx, {
        x: z.x, y, w: z.w, h: rowH,
        row, palette, index: i,
      });
    } else {
      renderTableRow(sl, pptx, {
        x: z.x, y, w: z.w, h: rowH,
        row, palette, index: i, labelWidth,
      });
    }
  });
}

module.exports = tableCard;
