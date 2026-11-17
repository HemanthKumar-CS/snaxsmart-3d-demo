# SnaxSmart demo

## Local development

Run from the project root:

```sh
npm install
npm run dev
```

Open the URL printed by Vite. Forms remain demonstration-only.

## Build

```sh
npm run build
npm run preview
```

The production output is in `dist/`. The 3D module is downloaded when a preview approaches the viewport. Offscreen and hidden previews stop rendering; reduced-motion previews settle without continuous animation. Small screens use lower rendering resolution and omit dynamic shadows.

## Browser regression checks

```sh
npm run test:ui
```

The check starts its own local server on port 5179 and stops it afterwards. It uses installed Microsoft Edge on Windows, or Playwright Chromium elsewhere (install with `npx playwright install chromium`). It checks all seven routes across seven viewport sizes, forward and reverse story scrolling on desktop, phone and landscape, keyboard controls, lazy 3D initialization, offscreen rendering, reduced motion, image fallback, and renderer disposal. Screenshots are saved in the ignored `test-results/` folder. To test an already running server, set `TEST_URL`.

Real-device GPU performance and Safari still need device testing before public launch.

## Typography, motion and locations

Manrope is self-hosted as a 25 KB Latin variable WOFF2 (SIL Open Font License in `src/assets/Manrope-OFL.txt`). Section entrances run once using IntersectionObserver and the Web Animations API; reduced-motion preferences disable them. Location filters and SVG pins support keyboard input.

Location names come from https://snaxsmart.com/. Bengaluru service areas are based on https://snaxsmart.com/smart-healthy-snacks-vending-machines-in-bangalore/ and Pune areas on https://snaxsmart.com/smart-healthy-snack-vending-machines-on-rent-in-pune-snaxsmart/. The map shows published locations, not live availability.

The coverage explorer lazy-loads Leaflet and marker clustering, with locally stored Natural Earth country and state geometry. It renders as SVG; no raster tiles, API keys, or external map requests are needed. Countries, coastlines and Indian state boundaries are drawn from Natural Earth's 1:50m public-domain datasets, reduced to relevant countries and rounded to three decimal places. Source: https://github.com/nvkelso/natural-earth-vector/tree/master/geojson; terms: https://www.naturalearthdata.com/about/terms-of-use/.

Locations indicate approximate city centres, not individual machine installations. Nearby locations form numbered groups; selecting a city isolates its pin in regional geographic context. This is a coverage explorer, without street navigation. The local outline remains available if the map module cannot load.

Headings reveal by word once in view; static local SVG paper grain and snack drawings need no animation loop.
