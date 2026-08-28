# @gum-jsx/web

The browser runtime for [gum.jsx](https://github.com/CompendiumLabs/gum-jsx): installs the fonts gum measured with so the page draws its SVG in the same faces, embeds those fonts into an SVG so it stands alone, rasterizes SVG to PNG on a `<canvas>` with the same interface as [`@gum-jsx/node`](https://github.com/CompendiumLabs/gum-jsx-node), and handles downloads and blob/data-url conversions. Framework-free; `@gum-jsx/core` is a peer dependency.

## Installation

```bash
npm install @gum-jsx/core @gum-jsx/web
```

## Usage

gum lays text out with real font metrics, so a browser host has to load the fonts before the first evaluation. `loadWebFonts` does that and also hands the bytes to the page through the `FontFace` API, so the SVG's `font-family` names resolve without any `@font-face` CSS or a second download:

```javascript
import { loadWebFonts } from '@gum-jsx/web'
import { evaluateGum } from '@gum-jsx/core/eval'
import '@gum-jsx/math'            // registers <Latex> and the KaTeX faces before loading

await loadWebFonts()              // everything registered; or a list of family names
container.innerHTML = evaluateGum('<Text>hello</Text>').svg()
```

To keep the initial download small, load only what a page needs (`loadWebFonts([ ...TEXT_FONTS, ...MATH_BASE_FONTS ])` from `@gum-jsx/core/fonts` and `@gum-jsx/math`) and call it again with more names later; loading is memoized per family. `installFontFaces()` on its own registers whatever core has already loaded — call it after `mathToSvgAsync`, which fetches faces on demand.

### Exporting

An SVG opened as a file, or drawn through `<img>`, cannot see the page's fonts. `embedFonts` returns a copy with the loaded faces inlined as data-url `@font-face` rules (pass the families it uses to keep it small):

```javascript
import { embedFonts, rasterizeSvg, rasterizePixels, downloadFile, downloadSvg } from '@gum-jsx/web'

const elem = evaluateGum(code, { size: 800 })
downloadSvg('figure.svg', embedFonts(elem).svg())

const png = await rasterizeSvg(elem, { size: 1600, background: 'white' })   // Blob
downloadFile('figure.png', png)
const pixels = await rasterizePixels(elem, { dpr: 2 })                      // ImageData
```

`rasterizeSvg(svg, { size?, background?, fonts?, dpr? })` takes an `Svg` element or markup, fits its own size into `size` (a number or `[width, height]`), embeds the fonts unless `fonts: false`, and draws it on a canvas; `rasterizePixels` returns the `ImageData` instead. Animated GIFs from a list of frames are the separate entry point `@gum-jsx/web/gif` (`rasterizeGif(frames, { delay })`), so the encoder is only bundled when used.
