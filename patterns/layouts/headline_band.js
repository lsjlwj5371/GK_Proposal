/**
 * ===============================================================
 *  headline_band.js -- Full-width headline banner + sub-content area
 * ===============================================================
 *
 *  Reference: p.9 (APEC 제안의 차별화) -- 상단에 회색 배경 밴드 안에
 *  큰 헤드라인 카피 + 설명 텍스트, 아래에 콘텐츠.
 *
 *  이 컴포넌트는 Content Box 상단에 시선을 잡는 메시지 밴드를 배치하고,
 *  남은 공간을 다른 레이아웃(flow_chain, comparison_columns 등)과 조합.
 *
 *  AP compliance: AP-14, AP-15, AP-21, AP-24, AP-25, AP-27
 *  All shapes use line: { type: 'none' }
 */

const { CB_X, CB_Y, CB_W, CB_H, CB_GAP } = require('./zone_helper');

const FN_XB = 'Pretendard ExtraBold';
const FN_MD = 'Pretendard Medium';
const FN    = 'Pretendard';

/**
 * Render headline band and return remaining zone
 *
 * @param {Object} sl - pptxgenjs slide object
 * @param {Object} pptx - pptxgenjs instance
 * @param {Object} options
 * @param {string} options.headline - Main headline text
 * @param {string} [options.subtext] - Supporting text below headline
 * @param {Object} options.palette - Color palette
 * @param {string} [options.style='subtle'] - 'subtle'|'bold'|'transparent'
 *   subtle: light gray bg band
 *   bold: DOM color bg with white text
 *   transparent: no bg, just large centered text
 * @param {number} [options.bandHeight] - Band height in inches (auto if omitted)
 * @param {Object} [options.zone] - { x, y, w, h } render area
 * @param {Array} [options.boldParts] - Parts of headline to render in bold/color
 *   [{ text:string, color?:string }]
 *
 * @returns {Object} remainingZone - { x, y, w, h } zone below the band
 */
function headlineBand(sl, pptx, options = {}) {
  const {
    headline = '',
    subtext,
    palette = {},
    style = 'subtle',
    bandHeight: bh,
    zone,
  } = options;

  const z = zone || { x: CB_X, y: CB_Y, w: CB_W, h: CB_H };

  // Auto band height
  const hasSubtext = !!subtext;
  const bandH = bh || (hasSubtext ? 1.20 : 0.80);

  // Band background
  if (style === 'subtle') {
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: z.x - 0.10, y: z.y, w: z.w + 0.20, h: bandH,
      fill: { color: palette.CD || 'F0F2F5' },
      line: { type: 'none' },
    });
  } else if (style === 'bold') {
    sl.addShape(pptx.shapes.RECTANGLE, {
      x: z.x - 0.10, y: z.y, w: z.w + 0.20, h: bandH,
      fill: { color: palette.DOM || '2B5797' },
      line: { type: 'none' },
    });
  }
  // 'transparent' style: no background

  // Text colors
  const headColor = style === 'bold' ? 'FFFFFF' : (palette.TD || '1A1A2E');
  const subColor = style === 'bold' ? 'EEEEEE' : (palette.TG || '555555');

  // Headline text
  const headlineFs = headline.length > 40 ? 20 : headline.length > 25 ? 24 : 28;

  // Check for bold parts (mixed formatting)
  if (options.boldParts && options.boldParts.length > 0) {
    // Build text runs for mixed bold/color
    const textRuns = [];
    let remaining = headline;

    options.boldParts.forEach(part => {
      const idx = remaining.indexOf(part.text);
      if (idx > 0) {
        textRuns.push({
          text: remaining.substring(0, idx),
          options: { fontSize: headlineFs, fontFace: FN_MD, color: headColor },
        });
      }
      textRuns.push({
        text: part.text,
        options: {
          fontSize: headlineFs, fontFace: FN_XB,
          color: part.color || palette.ACC || palette.DOM || headColor,
        },
      });
      if (idx >= 0) {
        remaining = remaining.substring(idx + part.text.length);
      }
    });

    if (remaining) {
      textRuns.push({
        text: remaining,
        options: { fontSize: headlineFs, fontFace: FN_MD, color: headColor },
      });
    }

    sl.addText(textRuns, {
      x: z.x + 0.15, y: z.y + 0.10,
      w: z.w - 0.30, h: hasSubtext ? bandH * 0.55 : bandH - 0.20,
      align: 'center', valign: 'middle',
      wrap: true, margin: 0,
    });
  } else {
    sl.addText(headline, {
      x: z.x + 0.15, y: z.y + 0.10,
      w: z.w - 0.30, h: hasSubtext ? bandH * 0.55 : bandH - 0.20,
      fontSize: headlineFs, fontFace: FN_XB, color: headColor,
      align: 'center', valign: 'middle',
      wrap: true, margin: 0,
    });
  }

  // Subtext
  if (subtext) {
    sl.addText(subtext, {
      x: z.x + 0.30, y: z.y + bandH * 0.55 + 0.05,
      w: z.w - 0.60, h: bandH * 0.40,
      fontSize: 12, fontFace: FN, color: subColor,
      align: 'center', valign: 'top',
      wrap: true, lineSpacingMultiple: 1.4, margin: 0,
    });
  }

  // Thin divider line below band
  sl.addShape(pptx.shapes.RECTANGLE, {
    x: z.x + 0.50, y: z.y + bandH + 0.05,
    w: z.w - 1.00, h: 0.01,
    fill: { color: palette.ACC || palette.DOM || '3366CC' },
    line: { type: 'none' },
  });

  // Return remaining zone below band
  const remainY = z.y + bandH + CB_GAP;
  return {
    x: z.x,
    y: remainY,
    w: z.w,
    h: z.h - bandH - CB_GAP,
  };
}

module.exports = headlineBand;
