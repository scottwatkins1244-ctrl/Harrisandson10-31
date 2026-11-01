import { defineConfig } from 'astro/config';
// 1:1 migration clone of https://harrisandsons.co (captured with REA). No redesign.
export default defineConfig({
  site: 'https://harrisandsons.co',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  compressHTML: false,
  devToolbar: { enabled: false },
});
