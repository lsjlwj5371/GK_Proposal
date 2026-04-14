#!/usr/bin/env node
/**
 * pptx_parser.js
 *
 * Parses a .pptx file and extracts all shape data from each slide into structured JSON.
 * Uses JSZip for ZIP extraction and regex for XML parsing (no XML library needed).
 *
 * Usage:
 *   node pptx_parser.js <input.pptx> [output.json]
 *
 * If output path is omitted, writes to <input_name>_parsed.json in same directory.
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// ── Constants ──────────────────────────────────────────────────────────────
const EMU_PER_INCH = 914400;
const EMU_PER_POINT = 12700;
const OOXML_DEG_FACTOR = 60000; // dir value / 60000 = degrees

// ── Helpers ────────────────────────────────────────────────────────────────

function emuToInch(emu) {
  if (emu == null) return null;
  return Math.round((Number(emu) / EMU_PER_INCH) * 10000) / 10000;
}

function emuToPoints(emu) {
  if (emu == null) return null;
  return Math.round((Number(emu) / EMU_PER_POINT) * 100) / 100;
}

function fontSizeToPt(hundredths) {
  if (hundredths == null) return null;
  return Number(hundredths) / 100;
}

function ooxmlDirToDeg(dir) {
  if (dir == null) return null;
  return Number(dir) / OOXML_DEG_FACTOR;
}

function rotToDeg(rot) {
  if (rot == null) return 0;
  return Number(rot) / 60000;
}

/** Extract a named attribute value from an XML tag string */
function attr(xml, name) {
  const re = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i');
  const m = xml.match(re);
  return m ? m[1] : null;
}

/** Find the first occurrence of a tag and return its full match (self-closing or with content) */
function findTag(xml, tagName) {
  // Try self-closing first
  const selfRe = new RegExp(`<${tagName}(?:\\s[^>]*)?\\/>`);
  const selfM = xml.match(selfRe);
  // Try open/close
  const pairRe = new RegExp(`<${tagName}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tagName}>`, 'i');
  const pairM = xml.match(pairRe);

  if (selfM && pairM) {
    return selfM.index < pairM.index ? selfM[0] : pairM[0];
  }
  return selfM ? selfM[0] : pairM ? pairM[0] : null;
}

/** Find all occurrences of a tag */
function findAllTags(xml, tagName) {
  const results = [];
  // Collect self-closing
  const selfRe = new RegExp(`<${tagName}(?:\\s[^>]*)?\\/\\s*>`, 'g');
  let m;
  while ((m = selfRe.exec(xml)) !== null) {
    results.push({ index: m.index, text: m[0] });
  }
  // Collect paired tags (non-greedy)
  const pairRe = new RegExp(`<${tagName}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tagName}\\s*>`, 'g');
  while ((m = pairRe.exec(xml)) !== null) {
    // Avoid double-counting if the paired match starts at a self-closing position
    const overlap = results.find(r => r.index === m.index);
    if (!overlap) {
      results.push({ index: m.index, text: m[0] });
    }
  }
  results.sort((a, b) => a.index - b.index);
  return results.map(r => r.text);
}

/** Extract the opening tag string (first < ... > portion) */
function openingTag(xml) {
  const m = xml.match(/^<[^>]+>/);
  return m ? m[0] : '';
}

// ── Shape parsing ──────────────────────────────────────────────────────────

function parseTransform(xml) {
  const xfrm = findTag(xml, 'a:xfrm');
  if (!xfrm) return null;
  const offTag = findTag(xfrm, 'a:off');
  const extTag = findTag(xfrm, 'a:ext');

  const rot = attr(openingTag(xfrm), 'rot');

  return {
    x: offTag ? emuToInch(attr(offTag, 'x')) : null,
    y: offTag ? emuToInch(attr(offTag, 'y')) : null,
    w: extTag ? emuToInch(attr(extTag, 'cx')) : null,
    h: extTag ? emuToInch(attr(extTag, 'cy')) : null,
    rotation: rotToDeg(rot),
  };
}

function parseGroupTransform(xml) {
  const grpSpPr = findTag(xml, 'p:grpSpPr');
  if (!grpSpPr) return null;
  const xfrm = findTag(grpSpPr, 'a:xfrm');
  if (!xfrm) return null;

  const offTag = findTag(xfrm, 'a:off');
  const extTag = findTag(xfrm, 'a:ext');
  const rot = attr(openingTag(xfrm), 'rot');

  return {
    x: offTag ? emuToInch(attr(offTag, 'x')) : null,
    y: offTag ? emuToInch(attr(offTag, 'y')) : null,
    w: extTag ? emuToInch(attr(extTag, 'cx')) : null,
    h: extTag ? emuToInch(attr(extTag, 'cy')) : null,
    rotation: rotToDeg(rot),
  };
}

function parseFill(spPr) {
  if (!spPr) return null;

  // Solid fill
  const solidFill = findTag(spPr, 'a:solidFill');
  if (solidFill) {
    const srgb = findTag(solidFill, 'a:srgbClr');
    const schemeClr = findTag(solidFill, 'a:schemeClr');
    let color = null;
    let transparency = 0;

    if (srgb) {
      color = attr(srgb, 'val');
      const alpha = findTag(srgb, 'a:alpha');
      if (alpha) {
        const alphaVal = attr(alpha, 'val');
        if (alphaVal) {
          transparency = Math.round((1 - Number(alphaVal) / 100000) * 100) / 100;
        }
      }
    } else if (schemeClr) {
      color = `scheme:${attr(schemeClr, 'val') || 'unknown'}`;
    }

    return { type: 'solid', color, transparency };
  }

  // Gradient fill
  const gradFill = findTag(spPr, 'a:gradFill');
  if (gradFill) {
    const stops = [];
    const gsItems = findAllTags(gradFill, 'a:gs');
    for (const gs of gsItems) {
      const pos = attr(gs, 'pos');
      const srgb = findTag(gs, 'a:srgbClr');
      const color = srgb ? attr(srgb, 'val') : null;
      stops.push({
        position: pos ? Number(pos) / 1000 : null, // percentage
        color,
      });
    }
    return { type: 'gradient', stops };
  }

  // No fill
  const noFill = findTag(spPr, 'a:noFill');
  if (noFill) {
    return { type: 'none' };
  }

  return null;
}

function parseLine(spPr) {
  if (!spPr) return 'none';

  const ln = findTag(spPr, 'a:ln');
  if (!ln) return 'none';

  // Check for noFill inside line
  const noFill = findTag(ln, 'a:noFill');
  if (noFill) return 'none';

  const width = attr(ln, 'w');
  const solidFill = findTag(ln, 'a:solidFill');
  let color = null;
  if (solidFill) {
    const srgb = findTag(solidFill, 'a:srgbClr');
    if (srgb) color = attr(srgb, 'val');
  }

  return {
    width: width ? emuToPoints(width) : null,
    color,
  };
}

function parseShadow(spPr) {
  if (!spPr) return null;

  const effectLst = findTag(spPr, 'a:effectLst');
  if (!effectLst) return null;

  const outerShdw = findTag(effectLst, 'a:outerShdw');
  if (!outerShdw) return null;

  const blurRad = attr(outerShdw, 'blurRad');
  const dist = attr(outerShdw, 'dist');
  const dir = attr(outerShdw, 'dir');

  // Shadow color + alpha
  const srgb = findTag(outerShdw, 'a:srgbClr');
  let color = '000000';
  let opacity = 1;
  if (srgb) {
    color = attr(srgb, 'val') || '000000';
    const alpha = findTag(srgb, 'a:alpha');
    if (alpha) {
      const alphaVal = attr(alpha, 'val');
      if (alphaVal) {
        opacity = Math.round(Number(alphaVal) / 1000) / 100; // 23000 -> 0.23
      }
    }
  }

  return {
    blur: blurRad ? emuToPoints(blurRad) : 0,
    offset: dist ? emuToPoints(dist) : 0,
    angle: dir ? ooxmlDirToDeg(dir) : 0,
    color,
    opacity,
  };
}

function parseTextBody(xml) {
  const txBody = findTag(xml, 'p:txBody');
  if (!txBody) return [];

  // Get body properties for default alignment
  const bodyPr = findTag(txBody, 'a:bodyPr');
  let defaultVAlign = null;
  if (bodyPr) {
    const anchor = attr(bodyPr, 'anchor');
    if (anchor) {
      const vMap = { t: 'top', ctr: 'middle', b: 'bottom' };
      defaultVAlign = vMap[anchor] || anchor;
    }
  }

  const textRuns = [];
  const paragraphs = findAllTags(txBody, 'a:p');

  for (const para of paragraphs) {
    // Paragraph-level alignment
    const pPr = findTag(para, 'a:pPr');
    let paragraphAlign = 'left';
    if (pPr) {
      const algn = attr(pPr, 'algn');
      if (algn) {
        const aMap = { l: 'left', ctr: 'center', r: 'right', just: 'justify' };
        paragraphAlign = aMap[algn] || algn;
      }
    }

    // Text runs
    const runs = findAllTags(para, 'a:r');
    for (const run of runs) {
      const rPr = findTag(run, 'a:rPr');
      const textTag = findTag(run, 'a:t');

      // Extract text content
      let text = '';
      if (textTag) {
        text = textTag.replace(/<[^>]+>/g, '');
      }

      if (!text) continue;

      let fontFace = null;
      let fontSize = null;
      let color = null;
      let bold = false;
      let italic = false;

      if (rPr) {
        const sz = attr(rPr, 'sz');
        fontSize = sz ? fontSizeToPt(sz) : null;
        bold = attr(rPr, 'b') === '1';
        italic = attr(rPr, 'i') === '1';

        // Font face - prefer latin, fallback to ea
        const latin = findTag(rPr, 'a:latin');
        const ea = findTag(rPr, 'a:ea');
        if (latin) fontFace = attr(latin, 'typeface');
        else if (ea) fontFace = attr(ea, 'typeface');

        // Text color
        const fill = findTag(rPr, 'a:solidFill');
        if (fill) {
          const srgb = findTag(fill, 'a:srgbClr');
          if (srgb) color = attr(srgb, 'val');
        }
      }

      textRuns.push({
        text,
        fontFace,
        fontSize,
        color,
        bold,
        italic,
        align: paragraphAlign,
        valign: defaultVAlign || 'top',
      });
    }
  }

  return textRuns;
}

function parseShape(xml, zOrder) {
  const spPr = findTag(xml, 'p:spPr') || findTag(xml, 'a:spPr');

  // Geometry type
  let type = 'unknown';
  if (spPr) {
    const prstGeom = findTag(spPr, 'a:prstGeom');
    if (prstGeom) {
      type = attr(prstGeom, 'prst') || 'unknown';
    }
    const custGeom = findTag(spPr, 'a:custGeom');
    if (custGeom) {
      type = 'custom';
    }
  }

  // Transform
  const transform = spPr ? parseTransform(spPr) : null;
  const position = transform
    ? { x: transform.x, y: transform.y, w: transform.w, h: transform.h }
    : { x: null, y: null, w: null, h: null };

  // Fill
  const fill = spPr ? parseFill(spPr) : null;

  // Line
  const line = parseLine(spPr);

  // Shadow
  const shadow = parseShadow(spPr);

  // Round rect radius
  let rectRadius = null;
  if (type === 'roundRect' && spPr) {
    const prstGeom = findTag(spPr, 'a:prstGeom');
    if (prstGeom) {
      const avLst = findTag(prstGeom, 'a:avLst');
      if (avLst) {
        const gd = findTag(avLst, 'a:gd');
        if (gd) {
          const fmla = attr(gd, 'fmla');
          if (fmla) {
            const valMatch = fmla.match(/val\s+(\d+)/);
            if (valMatch) {
              // OOXML uses a proportion where 50000 = 50% of half the shorter side
              // Convert to inches approximately
              const ratio = Number(valMatch[1]) / 100000;
              const shorterSide = Math.min(position.w || 0, position.h || 0);
              rectRadius = Math.round(ratio * shorterSide * 10000) / 10000;
            }
          }
        }
      }
    }
  }

  // Text
  const textRuns = parseTextBody(xml);

  // Name
  const nvSpPr = findTag(xml, 'p:nvSpPr');
  let shapeName = null;
  if (nvSpPr) {
    const cNvPr = findTag(nvSpPr, 'p:cNvPr');
    if (cNvPr) {
      shapeName = attr(cNvPr, 'name');
    }
  }

  return {
    zOrder,
    name: shapeName,
    type,
    position,
    fill: fill || { type: 'none' },
    line,
    shadow,
    rectRadius,
    rotation: transform ? transform.rotation : 0,
    textRuns,
  };
}

function parseConnectorShape(xml, zOrder) {
  const shape = parseShape(xml, zOrder);
  shape.type = shape.type === 'unknown' ? 'connector' : shape.type;
  return shape;
}

function parseGroupShape(xml) {
  const grpTransform = parseGroupTransform(xml);
  const position = grpTransform
    ? { x: grpTransform.x, y: grpTransform.y, w: grpTransform.w, h: grpTransform.h }
    : { x: null, y: null, w: null, h: null };

  // Remove the outer group tags to find children
  // We need to find child shapes inside the group but NOT in nested groups
  const children = [];

  // Find child <p:sp> shapes
  const childSps = findAllTags(xml, 'p:sp');
  childSps.forEach((sp, idx) => {
    children.push(parseShape(sp, idx));
  });

  // Find child <p:cxnSp> connector shapes
  const childCxns = findAllTags(xml, 'p:cxnSp');
  childCxns.forEach((cxn) => {
    children.push(parseConnectorShape(cxn, children.length));
  });

  return {
    position,
    rotation: grpTransform ? grpTransform.rotation : 0,
    children,
  };
}

// ── Slide parsing ──────────────────────────────────────────────────────────

function parseSlide(xml, slideIndex) {
  const shapes = [];
  const groups = [];
  let zCounter = 0;

  // We need to find top-level shapes in order.
  // Strategy: find all top-level <p:sp>, <p:grpSp>, <p:cxnSp> inside <p:spTree>
  const spTree = findTag(xml, 'p:spTree');
  if (!spTree) {
    return { index: slideIndex, shapes: [], groups: [] };
  }

  // Find shape markers and their positions for z-order
  const shapeEntries = [];

  // Simple shapes <p:sp>
  const spRegex = /<p:sp\b[^>]*>[\s\S]*?<\/p:sp\s*>/g;
  let m;
  while ((m = spRegex.exec(spTree)) !== null) {
    // Check if this <p:sp> is inside a <p:grpSp> by checking if there's an unclosed <p:grpSp> before it
    shapeEntries.push({ index: m.index, type: 'sp', text: m[0] });
  }

  // Connector shapes <p:cxnSp>
  const cxnRegex = /<p:cxnSp\b[^>]*>[\s\S]*?<\/p:cxnSp\s*>/g;
  while ((m = cxnRegex.exec(spTree)) !== null) {
    shapeEntries.push({ index: m.index, type: 'cxnSp', text: m[0] });
  }

  // Group shapes <p:grpSp>
  const grpRegex = /<p:grpSp\b[^>]*>[\s\S]*?<\/p:grpSp\s*>/g;
  while ((m = grpRegex.exec(spTree)) !== null) {
    shapeEntries.push({ index: m.index, type: 'grpSp', text: m[0] });
  }

  // Sort by position for z-order
  shapeEntries.sort((a, b) => a.index - b.index);

  // Filter out shapes that are children of groups
  // A shape is a child of a group if its index falls within a group's range
  const groupRanges = shapeEntries
    .filter(e => e.type === 'grpSp')
    .map(e => ({ start: e.index, end: e.index + e.text.length }));

  for (const entry of shapeEntries) {
    const isChildOfGroup = groupRanges.some(
      gr => entry.type !== 'grpSp' && entry.index > gr.start && entry.index < gr.end
    );

    if (isChildOfGroup) continue;

    if (entry.type === 'sp') {
      shapes.push(parseShape(entry.text, zCounter++));
    } else if (entry.type === 'cxnSp') {
      shapes.push(parseConnectorShape(entry.text, zCounter++));
    } else if (entry.type === 'grpSp') {
      groups.push(parseGroupShape(entry.text));
      zCounter++;
    }
  }

  return {
    index: slideIndex,
    shapes,
    groups,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node pptx_parser.js <input.pptx> [output.json]');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  let outputPath;

  if (args[1]) {
    outputPath = path.resolve(args[1]);
  } else {
    const dir = path.dirname(inputPath);
    const base = path.basename(inputPath, path.extname(inputPath));
    outputPath = path.join(dir, `${base}_parsed.json`);
  }

  // Validate input exists
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Parsing: ${inputPath}`);

  // Read and unzip
  const data = fs.readFileSync(inputPath);
  const zip = await JSZip.loadAsync(data);

  // Find slide files
  const slideFiles = [];
  zip.forEach((relativePath) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (match) {
      slideFiles.push({
        path: relativePath,
        num: parseInt(match[1], 10),
      });
    }
  });

  // Sort by slide number
  slideFiles.sort((a, b) => a.num - b.num);

  if (slideFiles.length === 0) {
    console.error('Error: No slides found in the .pptx file.');
    process.exit(1);
  }

  console.log(`Found ${slideFiles.length} slide(s)`);

  // Parse each slide
  const slides = [];
  for (const sf of slideFiles) {
    const xmlContent = await zip.file(sf.path).async('string');
    const slideData = parseSlide(xmlContent, sf.num);
    slides.push(slideData);
    const shapeCount = slideData.shapes.length + slideData.groups.length;
    console.log(`  Slide ${sf.num}: ${slideData.shapes.length} shape(s), ${slideData.groups.length} group(s)`);
  }

  // Build output
  const output = {
    source: path.basename(inputPath),
    parsedAt: new Date().toISOString(),
    slideCount: slides.length,
    slides,
  };

  // Write JSON
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nOutput written to: ${outputPath}`);
  console.log(`Total shapes: ${slides.reduce((acc, s) => acc + s.shapes.length, 0)}`);
  console.log(`Total groups: ${slides.reduce((acc, s) => acc + s.groups.length, 0)}`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
