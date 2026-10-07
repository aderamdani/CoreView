import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { PLACEHOLDER_TABS } from '../src/components/placeholderTabs.js';

const dashboard = readFileSync(new URL('../src/components/Dashboard.jsx', import.meta.url), 'utf-8');

/**
 * Tab ids that Dashboard routes to a placeholder panel, derived from the source
 * rather than restated here. If the two ever disagree, the sidebar either marks
 * a working section as unfinished or silently hides that a section is empty.
 *
 * The patterns tolerate arbitrary whitespace. The formatter wraps long lines, and
 * a pattern that assumed a single line silently missed an entry.
 */
const placeholderTabsFromRouting = () => {
  const wrappers = new Set(
    [...dashboard.matchAll(/const (render[A-Za-z]+) = \(\) =>\s*renderPlaceholder\(/g)].map((m) => m[1]),
  );
  const routed = [...dashboard.matchAll(/activeTab === '([a-z0-9-]+)'\s*&&\s*(render[A-Za-z]+)\(\)/g)];
  return new Set(routed.filter(([, , fn]) => wrappers.has(fn)).map(([, id]) => id));
};

test('the placeholder list matches what Dashboard actually routes', () => {
  const fromRouting = placeholderTabsFromRouting();
  assert.ok(fromRouting.size > 0, 'no placeholder routes found, the extraction broke');

  const onlyInList = [...PLACEHOLDER_TABS].filter((id) => !fromRouting.has(id)).sort();
  const onlyInRouting = [...fromRouting].filter((id) => !PLACEHOLDER_TABS.has(id)).sort();

  assert.deepEqual(onlyInList, [], 'marked as placeholder but Dashboard renders real content');
  assert.deepEqual(onlyInRouting, [], 'Dashboard renders a placeholder but the sidebar does not say so');
});

test('every placeholder tab exists in the sidebar', () => {
  const menus = readFileSync(new URL('../src/components/menus.jsx', import.meta.url), 'utf-8');
  const missing = [...PLACEHOLDER_TABS].filter((id) => !menus.includes(`id: '${id}'`)).sort();
  assert.deepEqual(missing, [], 'placeholder tab is not reachable from the sidebar');
});

test('the sidebar marker is rendered for placeholders', () => {
  assert.match(dashboard, /PLACEHOLDER_TABS\.has\(/);
  assert.match(dashboard, /sidebar-soon/);
});
