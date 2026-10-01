/**
 * URL of a file in /public, respecting Vite's `base` (needed on GitHub Pages,
 * where the site lives under /<repo>/ instead of the domain root).
 */
export const publicAsset = (file) => `${import.meta.env.BASE_URL}${file}`;

export const LOGO_URL = publicAsset('logo.png');
