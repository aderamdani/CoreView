declare global {
  /**
   * Replaced at build time by Vite's `define` from the `version` field in
   * package.json (see vite.config.js).
   */
  const __APP_VERSION__: string;
}

// Makes this file a module, which `declare module` needs in order to augment
// React's types rather than replace them.
export {};

declare module 'react' {
  interface CSSProperties {
    /**
     * Custom properties are legal in a style object and React passes them
     * through, but the built-in type does not allow them. One component sets a
     * per-item colour this way so its hover can live in CSS, so the index
     * signature is declared here instead of casting that object to `any`.
     */
    [key: `--${string}`]: string | number | undefined;
  }
}
