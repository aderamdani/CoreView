/**
 * Reading the bundled CHANGELOG.md for the release notes panel.
 *
 * Kept separate from the component so the parsing is plain data in and plain
 * data out, which makes it testable without a DOM or JSX.
 */

/**
 * Extract the section for one version from a Keep a Changelog file.
 *
 * Returns an array of `{ title, items }` groups, or null when the version has
 * no section yet. Sections can lag behind a version bump, and callers need to
 * tell "no notes" apart from "empty notes".
 */
export const sectionFor = (raw, version) => {
  if (typeof raw !== 'string' || !version) return null;

  const lines = raw.split('\n');
  const header = `## [${version}]`;
  const start = lines.findIndex((line) => line.startsWith(header));
  if (start === -1) return null;

  const groups = [];
  let current = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) break;
    if (line.startsWith('### ')) {
      current = { title: line.slice(4).trim(), items: [] };
      groups.push(current);
    } else if (line.startsWith('- ') && current) {
      current.items.push(line.slice(2).trim());
    }
  }

  // Drop headings that turned out to have no bullets.
  const populated = groups.filter((g) => g.items.length > 0);
  return populated.length ? populated : null;
};

/**
 * Split a changelog line into text and code segments.
 *
 * The file uses backticks for identifiers and [label](url) for links. Both are
 * reduced to their visible text here; the caller renders code spans and drops
 * the href, which keeps this module free of markup decisions.
 */
export const parseInline = (text) => {
  if (typeof text !== 'string') return [];
  const withoutLinks = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  return withoutLinks
    .split(/(`[^`]+`)/g)
    .filter((part) => part !== '')
    .map((part) =>
      part.startsWith('`') && part.endsWith('`') && part.length > 1
        ? { type: 'code', value: part.slice(1, -1) }
        : { type: 'text', value: part }
    );
};
