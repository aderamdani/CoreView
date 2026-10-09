import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

import { ROOT, collectTextFiles } from './helpers/textFiles.js';

/**
 * Unicode blocks that hold emoji. A character in any of these is an emoji for
 * the purposes of this project.
 */
const EMOJI_BLOCKS = [
  [0x1f000, 0x1faff, 'Pictographs, emoticons, transport, symbols'],
  [0x2600, 0x27bf, 'Miscellaneous symbols and dingbats'],
  [0x2b00, 0x2bff, 'Miscellaneous symbols and arrows'],
  [0x2300, 0x23ff, 'Miscellaneous technical'],
  [0x1f1e6, 0x1f1ff, 'Regional indicators'],
  [0xfe0f, 0xfe0f, 'Variation selector-16, which only appears in emoji'],
  [0x200d, 0x200d, 'Zero width joiner, which only appears in emoji sequences'],
];

/**
 * Characters inside those blocks that are typography rather than emoji, kept on
 * purpose. Each needs a reason, and the list should stay short.
 */
const ALLOWED = new Map([
  [0x2318, 'Place of Interest Sign, used as the macOS Command key in shortcut hints'],
]);

const isEmoji = (codePoint) => {
  if (ALLOWED.has(codePoint)) return false;
  return EMOJI_BLOCKS.some(([from, to]) => codePoint >= from && codePoint <= to);
};

const offendersIn = (file) => {
  const text = readFileSync(file, 'utf8');
  const hits = [];
  text.split('\n').forEach((line, index) => {
    for (const char of line) {
      if (isEmoji(char.codePointAt(0))) {
        hits.push({
          line: index + 1,
          char,
          code: `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
          text: line.trim().slice(0, 70),
        });
      }
    }
  });
  return hits;
};

test('no emoji anywhere in the repository', () => {
  const failures = [];
  for (const file of collectTextFiles()) {
    const hits = offendersIn(file);
    if (hits.length === 0) continue;
    const shown = hits
      .slice(0, 3)
      .map((h) => `line ${h.line}: ${h.code} ${JSON.stringify(h.char)} in ${JSON.stringify(h.text)}`)
      .join('; ');
    failures.push(`${relative(ROOT, file)} has ${hits.length} emoji (${shown})`);
  }
  assert.deepEqual(failures, [], `emoji found:\n${failures.join('\n')}`);
});

test('the allow list stays limited to typography', () => {
  // A guard against quietly growing the allow list into a loophole.
  assert.ok(ALLOWED.size <= 5, `allow list has grown to ${ALLOWED.size} entries`);
  for (const [codePoint, reason] of ALLOWED) {
    assert.ok(reason && reason.length > 10, `U+${codePoint.toString(16)} has no written reason`);
  }
});

test('the detector recognises the blocks it claims to', () => {
  // Written as code points on purpose. A literal emoji here would be flagged by
  // the scan above, which reads every file including this one.
  const emoji = [0x26a0, 0x2705, 0x1f6a7, 0x1f4e1, 0x1f6e1, 0x2b50, 0x23f1, 0x2764, 0x2328];
  for (const codePoint of emoji) {
    assert.ok(isEmoji(codePoint), `U+${codePoint.toString(16)} should be detected as emoji`);
  }

  // Typography that must stay, and the one allow-listed symbol.
  const typography = [0x2192, 0x2191, 0x2193, 0x2194, 0x2318];
  for (const codePoint of typography) {
    assert.equal(isEmoji(codePoint), false, `U+${codePoint.toString(16)} should not be treated as emoji`);
  }
});
