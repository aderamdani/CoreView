import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // Injected by Vite at build time from package.json (see vite.config.js).
        __APP_VERSION__: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // `React` is allowed to be imported without being referenced: React 19
      // uses the automatic JSX runtime, so the import is conventional rather
      // than required. Underscore-prefixed names stay allowed as the usual
      // "intentionally unused" marker.
      //
      // This used to ignore every identifier starting with a capital letter,
      // which silently hid unused icon imports. That is the same class of defect
      // as the missing lucide imports that once shipped a broken build, so the
      // loophole is closed.
      'no-unused-vars': ['error', { varsIgnorePattern: '^React$|^_' }],
      // `no-undef` does not inspect JSX element names, so a component used
      // without an import passed lint and then threw ReferenceError at runtime.
      // This rule is the one that catches it, statically.
      'react/jsx-no-undef': 'error',
      // Marks identifiers used only inside JSX as used, so no-unused-vars and
      // jsx-no-undef do not contradict each other.
      'react/jsx-uses-vars': 'error',
      // A missing key on a rendered list is a real defect, not a style nit.
      'react/jsx-key': 'error',
    },
  },
  {
    // Tests and build config run in Node, not in a browser.
    files: ['tests/**/*.{js,jsx}', 'vite.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Evilcharts components are vendored from a shadcn registry and are kept as
    // close to their published source as possible so they can be re-synced with
    // `npx shadcn@latest add`. The registry deliberately exports helper functions
    // next to the components (chart config readers, hooks, colour helpers), which
    // this rule forbids. Rewriting them would break that re-sync. The only cost of
    // turning it off here is that Fast Refresh fully reloads these files instead
    // of hot-swapping them.
    files: ['src/components/evilcharts/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]);
