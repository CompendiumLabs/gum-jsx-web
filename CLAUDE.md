# `@gum-jsx/web`

The browser runtime for gum.jsx, the counterpart of `@gum-jsx/node`: font installation via
the `FontFace` API, font embedding into SVG, canvas rasterization, and download/blob helpers.
A pure, framework-free library — React pieces belong in `@gum-jsx/react`. Core is a peer
dependency (`^1.7.0`, versioned in lockstep): everything here reads core's font registry
(`FONT_DATA`, `fontFace`, `loadFonts` from `@gum-jsx/core/fonts`), so faces an add-on registers
(the KaTeX ones from `@gum-jsx/math`) are covered without depending on the add-on. Math is only
a `devDependency`, for the tests. In the `gum-org` bun workspace both resolve to the sibling
checkouts.

It replaces what the studio (`~/mlai/gum`), the blog and `gum.tex` each carried by hand: the
`@font-face` CSS files (which had drifted from each other), a fonts-ready gate, and the studio's
`libs/render.ts`, `libs/utils.ts` and `gifenc` wiring.

## Layout

- `src/fonts.ts` - `loadedFaces()` enumerates the loaded registry as CSS faces (one per file; a light/regular/bold set becomes three, a `FONT_FACES` mapping carries its family/weight/style); `installFontFaces()` adds them to `document.fonts` once each (a no-op outside a browser); `loadWebFonts(names?)` is `loadFonts` + `installFontFaces`
- `src/embed.ts` - `fontCss(names?)` builds cached data-url `@font-face` rules from the loaded faces; `embedFonts(svg, names?)` puts them in an `Svg` element's `<style>` (via `clone`) or after the opening tag of markup
- `src/raster.ts` - `rasterizeSvg` (PNG `Blob`) and `rasterizePixels` (`ImageData`), the `@gum-jsx/node` interface plus `fonts` and `dpr`: the markup (fonts embedded, since an `<img>` renders in isolation) goes through a blob url into an `Image` and onto a canvas sized by `fitSize`. `drawSvgCanvas` returns the canvas for callers that want to keep drawing
- `src/files.ts` - `downloadFile`/`downloadSvg`, base64 and blob ↔ data-url conversions
- `src/gif.ts` - `rasterizeGif(frames, { delay, ... })` with `gifenc`, exported as `@gum-jsx/web/gif` only so the encoder is opt-in; `src/types/gifenc.d.ts` types the parts used
- `src/index.ts` - `export *` of everything but gif
- `scripts/test.ts` - The DOM-free parts under bun: face enumeration, embedding, base64 round trips

## Commands

```bash
bun tsc --noEmit      # typecheck (follows the workspace symlinks into core's and math's sources)
bun scripts/test.ts   # the DOM-free tests
```

The canvas path needs a browser; the studio's export pane and the blog are what exercise it.

## Conventions

- Registry names are not always CSS families: `KaTeX_Math` is the *Math-Italic* file and is
  drawn upright under that name (that is what the SVG says), while `KaTeX_Math-BoldItalic` maps
  through `FONT_FACES` to family `KaTeX_Math`, weight 700, italic. `loadedFaces` is the one place
  that translation happens; everything else consumes its output.
- Nothing here touches the DOM at import time, so the package is safe to import in node and in
  tests; the DOM-touching functions check for `document` and bail.
