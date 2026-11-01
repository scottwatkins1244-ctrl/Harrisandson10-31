# Harris & Sons — 1:1 Astro migration clone (SOP Step 1)

Exact clone of https://harrisandsons.co built with Astro. No redesign, no fixes.

## How REA (github.com/morluto/rea, v6.8.0) was used
REA was git-cloned and built from source, then its CLI drove the capture against a headless Chrome over CDP:
- `rea list-browser-targets` / `rea inspect-web-page` on all 258 sitemap pages → per-page DOM/resource Evidence (`rea-capture/resources.jsonl`, evidence IDs included). The resource inventory was used to find every same-origin asset the pages load (incl. lazy/JS-loaded Elementor chunks), which were downloaded into `public/` at their original paths.
- Page HTML is the exact server document, emitted verbatim by `src/pages/[...slug].astro` (byte-identical output).
- `rea capture-web-screenshot` + `rea compare-web-screenshots` for old-vs-new visual check (`rea-capture/rea-compare.json`).

## Build
npm install && npm run build  → dist/ (258 pages + locations.kml, sitemaps, robots.txt)
