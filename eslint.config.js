import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
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
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
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
])
