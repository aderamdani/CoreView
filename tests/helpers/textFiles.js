import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Repository root, resolved from this file rather than from the working
 * directory, so the guards behave the same however the test runner is invoked.
 */
export const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** Directories that hold generated or third-party output, never source. */
export const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'coverage']);

const TEXT_EXT = new Set(['.js', '.jsx', '.css', '.md', '.html']);

/**
 * Every text file the text guards scan. Both the emoji guard and the em dash
 * guard use this, so the two cannot drift apart and cover different files.
 *
 * @param {string} [dir] directory to walk, defaults to the repository root
 * @param {string[]} [found] accumulator used by the recursion
 * @returns {string[]} absolute paths
 */
export const collectTextFiles = (dir = ROOT, found = []) => {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectTextFiles(full, found);
    } else if (TEXT_EXT.has(entry.slice(entry.lastIndexOf('.')))) {
      found.push(full);
    }
  }
  return found;
};
