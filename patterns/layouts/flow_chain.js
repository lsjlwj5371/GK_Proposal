/**
 * ===============================================================
 *  flow_chain.js -- Horizontal/vertical process flow diagram
 * ===============================================================
 *
 *  Reference: p.9 (APEC 제안의 차별화) -- 원형 노드 9개가 수평으로
 *  화살표로 연결된 프로세스 흐름도.
 *
 *  지원 스타일:
 *   - 'circle': 원형 노드 + 화살표 (레퍼런스 스타일)
 *   - 'pill': 라운드 사각 노드 + 화살표
 *   - 'numbered': 번호가 붙은 스텝 (01 -> 02 -> 03)
 *
 *  AP compliance: AP-14, AP-15, AP-21, AP-24, AP-25, AP-27
 *  All shapes use line: { type: 'none' }
 */

const { CB_X, CB_Y, CB_W, CB_H } = require('./zone_helper');

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN    = 'Pretendard';

const sdw = () => ({ type: 'outer', blur: 6, offset: 3, angle: 270, color: '000000', opacity: 0.15 });

/**
 * Draw an arrow between two points
 */
function drawArrow(sl, pptx, { x1, y1, x2, y2, color, size = 0.12 }) {
  // Arrow body (line as thin rectangle)
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (Math.abs(dy) < 0.01) {
    // Horizontal arrow
    const lineLen = len - size * 1.5;
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: x1, y: y1 - 0.015,
      w: lineLen > 0 ? lineLen : 0.1, h: 0.03,
      fill: { color: color || '999999' },
      line: { type: 'none' },
    });
    // Arrowhead (triangle via RIGHT_TRIANGLE)
    sl.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
      x: x2 - size, y: y2 - size / 2,
      w: size, h: size,
      fill: { color: color || '999999' },
      line: { type: 'none' },
      rotate: 90,
    });
  }
}

/**
 * Circle-style flow node
 */
function renderCircleNode(sl, pptx, { cx, cy, r, label, isHighlight, palette, index }) {
  const fillColor = isHighlight
    ? (palette.DOM || '2B5797')
    : (palette.SEC || palette.ACC || '8FAADC');
  const textColor = isHighlight ? 'FFFFFF' : 'FFFFFF';

  // Circle
  sl.addShape(pptx.shapes.OVAL, {
    x: cx - r, y: cy - r, w: r * 2, h: r * 2,
    fill: { color: fillColor },
    line: { type: 'none' },
    shadow: isHighlight ? sdw() : undefined,
  });

  // Label
  sl.addText(label || '', {
    x: cx - r, y: cy - r, w: r * 2, h: r * 2,
    fontSize: r > 0.45 ? 13 : r > 0.35 ? 11 : 9,
    fontFace: FN_MD, color: textColor,
    align: 'center', valign: 'middle',
    wrap: true, margin: 0,
  });
}

/**
 * Pill-style flow node
 */
function renderPillNode(sl, pptx, { x, y, w, h, label, isHighlight, palette, index }) {
  const fillColor = isHighlight
    ? (palette.DOM || '2B5797')
    : (palette.CD || 'F0F2F5');
  const textColor = isHighlight ? 'FFFFFF' : (palette.TD || '333333');

  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: h / 2,
    fill: { color: fillColor },
    line: { type: 'none' },
    shadow: sdw(),
  });

  sl.addText(label || '', {
    x, y, w, h,
    fontSize: 11, fontFace: FN_MD, color: textColor,
    align: 'center', valign: 'middle',
    wrap: false, margin: 0,
  });
}

/**
 * Numbered step node
 */
function renderNumberedNode(sl, pptx, { x, y, w, h, label, isHighlight, palette, index }) {
  const stepNum = String(index + 1).padStart(2, '0');
  const fillColor = isHighlight
    ? (palette.DOM || '2B5797')
    : (palette.CD || 'F0F2F5');
  const numColor = isHighlight ? 'FFFFFF' : (palette.ACC || palette.DOM || '3366CC');
  const textColor = isHighlight ? 'FFFFFF' : (palette.TD || '333333');

  // Background
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: fillColor },
    line: { type: 'none' },
    shadow: sdw(),
  });

  // Step number
  sl.addText(stepNum, {
    x, y: y + 0.08, w, h: 0.35,
    fontSize: 22, fontFace: FN_XB, color: numColor, transparency: isHighlight ? 30 : 0,
    align: 'center', valign: 'middle',
    wrap: false, margin: 0,
  });

  // Label
  sl.addText(label || '', {
    x: x + 0.05, y: y + 0.45, w: w - 0.10, h: h - 0.55,
    fontSize: 10, fontFace: FN_MD, color: textColor,
    align: 'center', valign: 'top',
    wrap: true, margin: 0,
  });
}

/**
 * Main function: Flow chain diagram
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} options
 * @param {Array} options.nodes - Node data array
 *   [{ label:string, highlight?:boolean }]
 * @param {Object} options.palette - Color palette
 * @param {string} [options.style='circle'] - 'circle'|'pill'|'numbered'
 * @param {string} [options.direction='horizontal'] - 'horizontal'|'vertical'
 * @param {Object} [options.zone] - { x, y, w, h } render area
 * @param {boolean} [options.showArrows=true] - Show arrows between nodes
 * @param {string} [options.startLabel] - Label for start node (rendered differently)
 */
function flowChain(sl, pptx, options = {}) {
  const {
    nodes = [],
    palette = {},
    style = 'circle',
    direction = 'horizontal',
    zone,
    showArrows = true,
    startLabel,
  } = options;

  if (nodes.length === 0) return;

  const z = zone || { x: CB_X, y: CB_Y, w: CB_W, h: CB_H };
  const n = nodes.length;

  if (direction === 'horizontal') {
    const arrowSpace = showArrows ? 0.25 : 0;
    const totalArrowSpace = arrowSpace * (n - 1);

    if (style === 'circle') {
      // Circle nodes
      const maxR = Math.min(z.h / 2 - 0.1, 0.55);
      const availW = z.w - totalArrowSpace;
      const nodeSpace = availW / n;
      const r = Math.min(maxR, nodeSpace / 2 - 0.05);

      const cy = z.y + z.h / 2;

      nodes.forEach((node, i) => {
        const cx = z.x + i * (nodeSpace + arrowSpace) + nodeSpace / 2;

        renderCircleNode(sl, pptx, {
          cx, cy, r,
          label: node.label,
          isHighlight: node.highlight || false,
          palette, index: i,
        });

        // Arrow to next node
        if (showArrows && i < n - 1) {
          drawArrow(sl, pptx, {
            x1: cx + r + 0.05,
            y1: cy,
            x2: cx + r + arrowSpace + 0.05,
            y2: cy,
            color: palette.TG || '999999',
          });
        }
      });

    } else {
      // Pill or numbered nodes
      const nodeW = style === 'numbered' ? 1.1 : 1.3;
      const nodeH = style === 'numbered' ? 0.85 : 0.38;
      const totalNodeW = nodeW * n + arrowSpace * (n - 1);
      const scale = totalNodeW > z.w ? z.w / totalNodeW : 1;
      const adjNodeW = nodeW * scale;
      const adjArrowSpace = arrowSpace * scale;
      const startX = z.x + (z.w - (adjNodeW * n + adjArrowSpace * (n - 1))) / 2;
      const nodeY = z.y + (z.h - nodeH) / 2;

      nodes.forEach((node, i) => {
        const x = startX + i * (adjNodeW + adjArrowSpace);

        if (style === 'numbered') {
          renderNumberedNode(sl, pptx, {
            x, y: nodeY, w: adjNodeW, h: nodeH,
            label: node.label,
            isHighlight: node.highlight || false,
            palette, index: i,
          });
        } else {
          renderPillNode(sl, pptx, {
            x, y: nodeY, w: adjNodeW, h: nodeH,
            label: node.label,
            isHighlight: node.highlight || false,
            palette, index: i,
          });
        }

        // Arrow
        if (showArrows && i < n - 1) {
          drawArrow(sl, pptx, {
            x1: x + adjNodeW + 0.03,
            y1: nodeY + nodeH / 2,
            x2: x + adjNodeW + adjArrowSpace - 0.03,
            y2: nodeY + nodeH / 2,
            color: palette.TG || '999999',
          });
        }
      });
    }
  }
}

module.exports = flowChain;
