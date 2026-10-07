import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { sectionFor, parseInline } from '../src/utils/changelog.js';

const raw = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf-8');
const version = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
).version;

test('the shipped version has a changelog section', () => {
  const groups = sectionFor(raw, version);
  assert.ok(groups, `CHANGELOG.md has no section for ${version}`);
  assert.ok(groups.length > 0);
});

test('the section for the current version never contains another version', () => {
  const groups = sectionFor(raw, version);
  const titles = groups.map((g) => g.title);
  assert.equal(titles.some((t) => /^\[?\d+\.\d+\.\d+/.test(t)), false);
});

test('every group has at least one item', () => {
  for (const group of sectionFor(raw, version)) {
    assert.ok(group.items.length > 0, `${group.title} has no items`);
  }
});

test('an unknown version returns null so the panel can show its empty state', () => {
  assert.equal(sectionFor(raw, '99.99.99'), null);
  assert.equal(sectionFor(raw, ''), null);
  assert.equal(sectionFor(null, '1.0.0'), null);
});

test('a version header without bullets is treated as no notes', () => {
  const fake = '# Changelog\n\n## [2.0.0] - 2026-01-01\n\n### Ditambahkan\n\nTidak ada.\n';
  assert.equal(sectionFor(fake, '2.0.0'), null);
});

test('parsing stops at the next version heading', () => {
  const fake = [
    '# Changelog',
    '## [2.0.0] - 2026-01-01',
    '### Ditambahkan',
    '- dua',
    '## [1.0.0] - 2025-01-01',
    '### Ditambahkan',
    '- satu',
  ].join('\n');

  const groups = sectionFor(fake, '2.0.0');
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].items, ['dua']);
});

test('inline code is split out of a line', () => {
  assert.deepEqual(parseInline('Pakai `flag` di sini'), [
    { type: 'text', value: 'Pakai ' },
    { type: 'code', value: 'flag' },
    { type: 'text', value: ' di sini' },
  ]);
});

test('markdown links are reduced to their label', () => {
  assert.deepEqual(parseInline('Lihat [panduan](https://example.com).'), [
    { type: 'text', value: 'Lihat panduan.' },
  ]);
});

test('plain text survives untouched and empty input yields nothing', () => {
  assert.deepEqual(parseInline('tanpa formatasi'), [
    { type: 'text', value: 'tanpa formatasi' },
  ]);
  assert.deepEqual(parseInline(''), []);
  assert.deepEqual(parseInline(null), []);
});

test('changelog prose contains no em dash', () => {
  assert.equal(raw.includes('\u2014'), false, 'em dash found in CHANGELOG.md');
});

test('a wrapped entry is joined back into one item', () => {
  const fake = [
    '# Changelog',
    '## [3.0.0] - 2026-01-01',
    '### Diperbaiki',
    '- Baris pertama dari entri yang panjang',
    '  dan lanjutannya ada di baris berikutnya.',
    '- Entri pendek.',
  ].join('\n');

  const items = sectionFor(fake, '3.0.0')[0].items;
  assert.equal(items.length, 2);
  assert.equal(
    items[0],
    'Baris pertama dari entri yang panjang dan lanjutannya ada di baris berikutnya.'
  );
  assert.equal(items[1], 'Entri pendek.');
});

test('a paragraph after a bullet is not swallowed into it', () => {
  const fake = [
    '## [3.0.0] - 2026-01-01',
    '### Diperbaiki',
    '- Satu entri.',
    '',
    'Paragraf bebas yang bukan lanjutan butir.',
  ].join('\n');

  const items = sectionFor(fake, '3.0.0')[0].items;
  assert.deepEqual(items, ['Satu entri.']);
});

test('every shipped entry is complete, not cut at a line break', () => {
  // Guards the bug the browser check found: entries used to end mid-sentence.
  for (const group of sectionFor(raw, version)) {
    for (const item of group.items) {
      assert.doesNotMatch(item, /\b(dengan|yang|dan|untuk|pada|dari|di|ke)$/i,
        `entry looks truncated: "${item}"`);
      const backticks = (item.match(/`/g) || []).length;
      assert.equal(backticks % 2, 0, `unbalanced backticks in: "${item}"`);
    }
  }
});
