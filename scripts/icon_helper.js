/**
 * icon_helper.js - Icon loading, color modification, and format conversion utility
 * for the GroundK PPT generation skill.
 *
 * Icons: Lineicons SVGs at ../assets/icons/svgs/
 * Manifest: ../assets/icons/icon_manifest.json
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ── Paths ──────────────────────────────────────────────────────────────────────
const ICONS_DIR = path.resolve(__dirname, '../assets/icons/svgs');
const MANIFEST_PATH = path.resolve(__dirname, '../assets/icons/icon_manifest.json');
const DEFAULT_COLOR = '#323544';

// ── Manifest cache ─────────────────────────────────────────────────────────────
let _manifestCache = null;

function loadManifest() {
  if (_manifestCache) return _manifestCache;
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  _manifestCache = JSON.parse(raw);
  return _manifestCache;
}

// ── 1. findIcons(query, options) ───────────────────────────────────────────────
/**
 * Find matching icons by keyword (Korean or English, partial match).
 * @param {string|string[]} query - keyword(s) to search
 * @param {object}  [options]
 * @param {string}  [options.category] - filter by category
 * @param {number}  [options.limit=5]  - max results
 * @returns {Array} manifest entries sorted by relevance
 */
function findIcons(query, options = {}) {
  const { category, limit = 5 } = options;
  const manifest = loadManifest();
  const queries = (Array.isArray(query) ? query : [query])
    .map(q => q.toLowerCase().trim())
    .filter(Boolean);

  if (queries.length === 0) return [];

  const scored = [];

  for (const entry of manifest.icons) {
    if (category && entry.category !== category) continue;

    let bestScore = 0;
    let matchedKw = null;

    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      for (const q of queries) {
        if (kwLower === q) {
          // Exact match — highest priority
          if (3 > bestScore) { bestScore = 3; matchedKw = kw; }
        } else if (kwLower.includes(q)) {
          // Keyword contains query — good match
          if (2 > bestScore) { bestScore = 2; matchedKw = kw; }
        } else if (q.includes(kwLower)) {
          // Query contains keyword — weaker match
          if (1 > bestScore) { bestScore = 1; matchedKw = kw; }
        }
      }
    }

    if (bestScore > 0) {
      scored.push({ entry, score: bestScore, matchedKw });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.entry);
}

// ── 2. loadIcon(filename, options) ─────────────────────────────────────────────
/**
 * Load and customize an SVG icon.
 * @param {string} filename - e.g. "rocket-5.svg"
 * @param {object} [options]
 * @param {string} [options.color] - hex color to replace default #323544
 * @param {number} [options.size=64] - target size in pixels
 * @returns {string} modified SVG string
 */
function loadIcon(filename, options = {}) {
  const { color, size = 64 } = options;
  const filePath = path.join(ICONS_DIR, filename);
  let svg = fs.readFileSync(filePath, 'utf-8');

  // Replace default color in both fill and stroke attributes
  if (color) {
    const defaultRegex = new RegExp(escapeRegex(DEFAULT_COLOR), 'gi');
    svg = svg.replace(defaultRegex, color);
  }

  // Update width/height attributes while preserving viewBox
  svg = svg.replace(/\bwidth="[^"]*"/, `width="${size}"`);
  svg = svg.replace(/\bheight="[^"]*"/, `height="${size}"`);

  return svg;
}

// ── 3. iconToBase64PNG(filename, options) ──────────────────────────────────────
/**
 * Convert SVG icon to base64 PNG string for pptxgenjs.
 * @param {string} filename
 * @param {object} [options]
 * @param {string} [options.color]      - hex color
 * @param {number} [options.size=64]    - pixel size
 * @param {string} [options.background="transparent"] - background color or "transparent"
 * @returns {Promise<string>} base64 string prefixed with "image/png;base64,"
 */
async function iconToBase64PNG(filename, options = {}) {
  const { color, size = 64, background = 'transparent' } = options;
  const svg = loadIcon(filename, { color, size });

  const sharpOpts = {};
  if (background === 'transparent') {
    sharpOpts.channels = 4;
  }

  let pipeline = sharp(Buffer.from(svg)).resize(size, size).png();

  if (background !== 'transparent') {
    pipeline = pipeline.flatten({ background });
  }

  const pngBuffer = await pipeline.toBuffer();
  const b64 = pngBuffer.toString('base64');
  return `image/png;base64,${b64}`;
}

// ── 4. iconToPNGFile(filename, outputPath, options) ───────────────────────────
/**
 * Save icon as a PNG file.
 * @param {string} filename
 * @param {string} outputPath - destination file path
 * @param {object} [options]  - same as iconToBase64PNG
 * @returns {Promise<string>} the outputPath
 */
async function iconToPNGFile(filename, outputPath, options = {}) {
  const { color, size = 64, background = 'transparent' } = options;
  const svg = loadIcon(filename, { color, size });

  let pipeline = sharp(Buffer.from(svg)).resize(size, size).png();

  if (background !== 'transparent') {
    pipeline = pipeline.flatten({ background });
  }

  const absOut = path.resolve(outputPath);
  const dir = path.dirname(absOut);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await pipeline.toFile(absOut);
  return absOut;
}

// ── 5. getIconPath(filename) ──────────────────────────────────────────────────
/**
 * Get absolute path to an SVG file.
 * @param {string} filename
 * @returns {string} absolute path
 */
function getIconPath(filename) {
  return path.resolve(ICONS_DIR, filename);
}

// ── 6. listCategories() ──────────────────────────────────────────────────────
/**
 * List all available categories with icon counts.
 * @returns {Array<{category: string, count: number}>}
 */
function listCategories() {
  const manifest = loadManifest();
  const counts = {};

  for (const entry of manifest.icons) {
    const cat = entry.category || 'uncategorized';
    counts[cat] = (counts[cat] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// ── 7. suggestIcons(contentText, options) ─────────────────────────────────────
/**
 * AI-free keyword extraction and icon suggestion.
 * @param {string} contentText - page title, description, etc.
 * @param {object} [options]
 * @param {number} [options.limit=3] - max suggestions
 * @returns {Array<{icon: object, score: number, matchedKeyword: string}>}
 */
function suggestIcons(contentText, options = {}) {
  const { limit = 3 } = options;
  const manifest = loadManifest();

  // Extract tokens from text by splitting on common delimiters
  const tokens = contentText
    .toLowerCase()
    .split(/[\s,.\-\/|·:;!?()[\]{}'"~`@#$%^&*+=<>]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 1);

  const results = [];

  for (const entry of manifest.icons) {
    let bestScore = 0;
    let matchedKeyword = null;

    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();

      for (const token of tokens) {
        let score = 0;
        if (kwLower === token) {
          score = 3; // exact match
        } else if (kwLower.includes(token) && token.length >= 2) {
          score = 2; // keyword contains token
        } else if (token.includes(kwLower) && kwLower.length >= 2) {
          score = 1; // token contains keyword
        }

        if (score > bestScore) {
          bestScore = score;
          matchedKeyword = kw;
        }
      }
    }

    if (bestScore > 0) {
      results.push({ icon: entry, score: bestScore, matchedKeyword });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Exports ────────────────────────────────────────────────────────────────────
module.exports = {
  findIcons,
  loadIcon,
  iconToBase64PNG,
  iconToPNGFile,
  getIconPath,
  listCategories,
  suggestIcons,
};
