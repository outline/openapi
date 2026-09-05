const fs = require('fs');
const path = require('path');

/**
 * Keeps spec3.yml in a predictable, alphabetical order:
 *
 *  - The top-level `tags:` array is sorted by tag name (case-insensitive). This
 *    is what drives the ordering of sections in the rendered documentation.
 *  - The `paths:` section is grouped by namespace (the part of the path before
 *    the first `.`) in case-insensitive alphabetical order. The order of methods
 *    *within* each namespace is preserved.
 *
 * The exact formatting of every block is preserved; only their order changes.
 *
 * Usage: node utils/sortSpec.js [--check]
 *   --check  Exit non-zero if the file is not already sorted (no write).
 */

const inputFile = path.join(__dirname, '..', 'spec3.yml');
const check = process.argv.includes('--check');

const isTopLevelKey = (l) => /^\S/.test(l) && l.endsWith(':');

/**
 * Reorders the blocks of a single section in place within `lines`.
 * @param {string[]} lines        All lines of the file.
 * @param {string} sectionKey     The top-level key, e.g. "tags:" or "paths:".
 * @param {(l: string) => boolean} isBlockStart  True when a line starts a block.
 * @param {(l: string) => string} keyOf          Sort key from a block-start line.
 * @returns {string[]} The reordered lines.
 */
const sortSection = (lines, sectionKey, isBlockStart, keyOf) => {
  const sectionIdx = lines.findIndex((l) => l === sectionKey);
  if (sectionIdx === -1) {
    throw new Error(`Could not find a top-level \`${sectionKey}\` key.`);
  }

  const firstBlockIdx = lines.findIndex((l, i) => i > sectionIdx && isBlockStart(l));
  if (firstBlockIdx === -1) {
    throw new Error(`No blocks found under \`${sectionKey}\`.`);
  }

  let endIdx = lines.findIndex((l, i) => i > firstBlockIdx && isTopLevelKey(l));
  if (endIdx === -1) {
    endIdx = lines.length;
  }

  const header = lines.slice(0, firstBlockIdx);
  const body = lines.slice(firstBlockIdx, endIdx);
  const tail = lines.slice(endIdx);

  const blocks = [];
  let current = null;
  for (const line of body) {
    if (isBlockStart(line)) {
      current = { key: keyOf(line), lines: [line] };
      blocks.push(current);
    } else {
      if (!current) {
        throw new Error(`Unexpected line before first block in \`${sectionKey}\`: ${line}`);
      }
      current.lines.push(line);
    }
  }

  // Stable sort so any secondary ordering (e.g. method order) is preserved.
  const sorted = blocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => {
      const ka = a.block.key.toLowerCase();
      const kb = b.block.key.toLowerCase();
      if (ka < kb) return -1;
      if (ka > kb) return 1;
      return a.index - b.index;
    })
    .map(({ block }) => block);

  return [...header, ...sorted.flatMap((block) => block.lines), ...tail];
};

try {
  const original = fs.readFileSync(inputFile, 'utf8');
  let lines = original.split('\n');

  // Sort tags by name.
  lines = sortSection(
    lines,
    'tags:',
    (l) => /^ {2}- name:/.test(l),
    (l) => l.match(/^ {2}- name:\s*(.+)\s*$/)[1]
  );

  // Sort paths by namespace (the part before the first `.`).
  lines = sortSection(
    lines,
    'paths:',
    (l) => /^ {2}"\//.test(l),
    (l) => l.match(/^ {2}"\/([^."]+)/)[1]
  );

  const reordered = lines.join('\n');

  if (reordered === original) {
    console.log('✓ Spec tags and paths are already sorted');
    process.exit(0);
  }

  if (check) {
    console.error('✗ Spec is not sorted. Run `node utils/sortSpec.js` to fix.');
    process.exit(1);
  }

  fs.writeFileSync(inputFile, reordered);
  console.log('✓ Reordered spec tags and paths into alphabetical order');
} catch (error) {
  console.error('Error sorting spec:', error.message);
  process.exit(1);
}
