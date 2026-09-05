const fs = require('fs');
const path = require('path');

/**
 * Reorders the `paths:` section of spec3.yml so that endpoints are grouped by
 * namespace (the part of the path before the first `.`) in case-insensitive
 * alphabetical order. The order of methods *within* each namespace is preserved,
 * as is the exact formatting of every endpoint block.
 *
 * Usage: node utils/sortPaths.js [--check]
 *   --check  Exit non-zero if the file is not already sorted (no write).
 */

const inputFile = path.join(__dirname, '..', 'spec3.yml');
const check = process.argv.includes('--check');

const namespaceOf = (line) => {
  // Matches:   "/documents.info":  ->  documents
  const match = line.match(/^ {2}"\/([^."]+)/);
  return match ? match[1] : null;
};

try {
  const original = fs.readFileSync(inputFile, 'utf8');
  const lines = original.split('\n');

  const pathsIdx = lines.findIndex((l) => l === 'paths:');
  if (pathsIdx === -1) {
    throw new Error('Could not find a top-level `paths:` key.');
  }

  const isEndpointStart = (l) => /^ {2}"\//.test(l);
  const isTopLevelKey = (l) => /^\S/.test(l) && l.endsWith(':');

  const firstBlockIdx = lines.findIndex((l, i) => i > pathsIdx && isEndpointStart(l));
  if (firstBlockIdx === -1) {
    throw new Error('No endpoint blocks found under `paths:`.');
  }

  // The paths section ends at the next top-level key (e.g. `components:`).
  let endIdx = lines.findIndex((l, i) => i > firstBlockIdx && isTopLevelKey(l));
  if (endIdx === -1) {
    endIdx = lines.length;
  }

  const header = lines.slice(0, firstBlockIdx);
  const body = lines.slice(firstBlockIdx, endIdx);
  const tail = lines.slice(endIdx);

  // Split the body into one block per endpoint.
  const blocks = [];
  let current = null;
  for (const line of body) {
    if (isEndpointStart(line)) {
      current = { namespace: namespaceOf(line), key: line.trim(), lines: [line] };
      blocks.push(current);
    } else {
      if (!current) {
        throw new Error(`Unexpected line before first endpoint block: ${line}`);
      }
      current.lines.push(line);
    }
  }

  // Stable sort by namespace only, so intra-namespace method order is preserved.
  const sorted = blocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => {
      const na = a.block.namespace.toLowerCase();
      const nb = b.block.namespace.toLowerCase();
      if (na < nb) return -1;
      if (na > nb) return 1;
      return a.index - b.index;
    })
    .map(({ block }) => block);

  const reordered = [
    ...header,
    ...sorted.flatMap((block) => block.lines),
    ...tail,
  ].join('\n');

  if (reordered === original) {
    console.log('✓ Paths are already sorted by namespace');
    process.exit(0);
  }

  if (check) {
    console.error('✗ Paths are not sorted by namespace. Run `node utils/sortPaths.js` to fix.');
    process.exit(1);
  }

  fs.writeFileSync(inputFile, reordered);
  console.log(`✓ Reordered ${blocks.length} endpoints into namespace alphabetical order`);
} catch (error) {
  console.error('Error sorting paths:', error.message);
  process.exit(1);
}
