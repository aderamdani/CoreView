import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

import { ROOT, collectTextFiles } from './helpers/textFiles.js';

/**
 * Em dash, U+2014. The project writes in Indonesian and treats this character
 * as slop: it is the dash an English-trained model reaches for when a comma, a
 * colon, or a full stop is what the sentence actually needs.
 *
 * En dash (U+2013) and the ellipsis (U+2026) are deliberately NOT covered.
 * They are used for numeric ranges and for quoted text that trails off, which
 * is ordinary Indonesian typography.
 */
const EM_DASH = '\u2014';

const offendersIn = (file) => {
  const lines = readFileSync(file, 'utf8').split('\n');
  const hits = [];
  lines.forEach((line, index) => {
    if (line.includes(EM_DASH)) {
      hits.push({ line: index + 1, text: line.trim().slice(0, 70) });
    }
  });
  return hits;
};

test('no em dash anywhere in the repository', () => {
  const failures = [];
  for (const file of collectTextFiles()) {
    const hits = offendersIn(file);
    if (hits.length === 0) continue;
    const shown = hits
      .slice(0, 3)
      .map((h) => `line ${h.line}: ${JSON.stringify(h.text)}`)
      .join('; ');
    failures.push(`${relative(ROOT, file)} has ${hits.length} em dash (${shown})`);
  }
  assert.deepEqual(failures, [], `em dash found:\n${failures.join('\n')}`);
});

test('the detector recognises an em dash and leaves its neighbours alone', () => {
  assert.ok(EM_DASH.includes('\u2014'));
  assert.notEqual(EM_DASH, '\u2013');
  assert.notEqual(EM_DASH, '\u2026');
  // A comma, a colon, and a hyphen are not dashes of this kind.
  for (const keep of [',', ':', '-', '\u2013', '\u2026']) {
    assert.notEqual(keep, EM_DASH);
  }
});
