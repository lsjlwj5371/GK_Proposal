/**
 * ===============================================================
 *  split_text_visual.js -- Text sections + visual diagram split
 * ===============================================================
 *
 *  Reference: p.12 (APEC 과업의 추진 전략) -- 좌측에 4개 텍스트 섹션
 *  (공간/시간/동선/경험의 확장), 우측에 지도 다이어그램.
 *
 *  Use cases:
 *   - 전략 설명 + 지도/다이어그램
 *   - 서비스 항목 + 개념도/플로우
 *   - 기능 설명 + 스크린샷/인포그래픽
 *
 *  AP compliance: AP-14, AP-15, AP-21, AP-24, AP-25, AP-27
 *  All shapes use line: { type: 'none' }
 */

const { CB_X, CB_Y, CB_W, CB_H, CB_GAP } = require('./zone_helper');

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN    = 'Pretendard';

/**
 * Render text sections on one side
 */
function renderTextSections(sl, pptx, { x, y, w, h, sections, palette }) {
  const n = sections.length;
  const sectionGap = 0.15;
  const totalGap = sectionGap * (n - 1);
  const sectionH = (h - totalGap) / n;

  sections.forEach((sec, i) => {
    const sy = y + i * (sectionH + sectionGap);

    // Section color bar (left accent)
    sl.addShape(pptx.shapes.RECTANGLE, {
      x, y: sy, w: 0.04, h: sectionH - 0.05,
      fill: { color: palette.ACC || palette.DOM || '3366CC' },
      line: { type: 'none' },
    });

    // Section title
    const titleFs = w > 4 ? 15 : 13;
    sl.addText(sec.title || '', {
      x: x + 0.18, y: sy, w: w - 0.22, h: 0.32,
      fontSize: titleFs, fontFace: FN_XB,
      color: palette.ACC || palette.DOM || '2B5797',
      valign: 'middle', wrap: false, margin: 0,
      line: { type: 'none' },
    });

    // Section description
    if (sec.desc) {
      sl.addText(sec.desc, {
        x: x + 0.18, y: sy + 0.35, w: w - 0.22, h: 0.28,
        fontSize: 11, fontFace: FN_MD, color: palette.TD || '333333',
        valign: 'top', wrap: true, margin: 0,
        lineSpacingMultiple: 1.3,
      });
    }

    // Bullet items
    if (sec.bullets && sec.bullets.length > 0) {
      const bulletStartY = sy + (sec.desc ? 0.65 : 0.35);
      const bulletH = sectionH - (sec.desc ? 0.70 : 0.40);
      const bulletText = sec.bullets.map(b => `  ${b}`).join('\n');

      sl.addText(bulletText, {
        x: x + 0.18, y: bulletStartY,
        w: w - 0.22, h: Math.max(bulletH, 0.3),
        fontSize: 10, fontFace: FN, color: palette.TG || '555555',
        valign: 'top', wrap: true, margin: 0,
        lineSpacingMultiple: 1.35,
      });
    }
  });
}

/**
 * Render visual placeholder (map, diagram, image)
 */
function renderVisualPlaceholder(sl, pptx, { x, y, w, h, visual, palette }) {
  // Background
  sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: palette.CD || 'F0F4F8' },
    line: { type: 'none' },
  });

  // Placeholder text
  const placeholderType = visual.type || 'image';
  const typeLabels = {
    map: 'Map Area',
    diagram: 'Diagram Area',
    image: 'Image Area',
    chart: 'Chart Area',
    screenshot: 'Screenshot Area',
    infographic: 'Infographic Area',
  };

  sl.addText(typeLabels[placeholderType] || 'Visual Area', {
    x, y: y + h / 2 - 0.20, w, h: 0.25,
    fontSize: 11, fontFace: FN_MD, color: palette.TG || '999999',
    align: 'center', valign: 'middle',
    wrap: false, margin: 0,
  });

  if (visual.description) {
    sl.addText(`(${visual.description})`, {
      x: x + 0.2, y: y + h / 2 + 0.10, w: w - 0.4, h: 0.25,
      fontSize: 9, fontFace: FN, color: palette.TG || 'AAAAAA',
      align: 'center', valign: 'middle',
      wrap: true, margin: 0,
    });
  }

  // Labels on visual (e.g., location labels on map)
  if (visual.labels && visual.labels.length > 0) {
    visual.labels.forEach(lbl => {
      // Position labels as relative % of visual area
      const lx = x + (lbl.xPct || 0.5) * w;
      const ly = y + (lbl.yPct || 0.5) * h;

      // Label badge
      const labelW = Math.max(lbl.text.length * 0.12 + 0.2, 0.8);
      sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: lx - labelW / 2, y: ly - 0.14,
        w: labelW, h: 0.28,
        rectRadius: 0.04,
        fill: { color: palette.DOM || '2B5797' },
        line: { type: 'none' },
      });

      sl.addText(lbl.text, {
        x: lx - labelW / 2, y: ly - 0.14,
        w: labelW, h: 0.28,
        fontSize: 9, fontFace: FN_MD, color: 'FFFFFF',
        align: 'center', valign: 'middle',
        wrap: false, margin: 0,
      });
    });
  }
}

/**
 * Main function: Split text + visual layout
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} options
 * @param {Array} options.sections - Text section data
 *   [{ title:string, desc?:string, bullets?:string[] }]
 * @param {Object} options.visual - Visual area config
 *   { type:'map'|'diagram'|'image'|'chart', description?:string,
 *     labels?:[{ text:string, xPct:number, yPct:number }] }
 * @param {Object} options.palette - Color palette
 * @param {number} [options.splitRatio=0.45] - Text side ratio (0~1)
 * @param {string} [options.textSide='left'] - 'left'|'right'
 * @param {Object} [options.zone] - { x, y, w, h } render area
 */
function splitTextVisual(sl, pptx, options = {}) {
  const {
    sections = [],
    visual = {},
    palette = {},
    splitRatio = 0.45,
    textSide = 'left',
    zone,
  } = options;

  const z = zone || { x: CB_X, y: CB_Y, w: CB_W, h: CB_H };
  const gap = 0.25;
  const usableW = z.w - gap;
  const textW = usableW * splitRatio;
  const visualW = usableW * (1 - splitRatio);

  let textX, visualX;
  if (textSide === 'left') {
    textX = z.x;
    visualX = z.x + textW + gap;
  } else {
    visualX = z.x;
    textX = z.x + visualW + gap;
  }

  // Render text sections
  if (sections.length > 0) {
    renderTextSections(sl, pptx, {
      x: textX, y: z.y, w: textW, h: z.h,
      sections, palette,
    });
  }

  // Render visual placeholder
  renderVisualPlaceholder(sl, pptx, {
    x: visualX, y: z.y, w: visualW, h: z.h,
    visual, palette,
  });
}

module.exports = splitTextVisual;
