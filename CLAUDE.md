# `@gum-jsx/web`

The browser runtime for gum.jsx, the counterpart of `@gum-jsx/node`: font installation via
the `FontFace` API, font embedding into SVG, canvas rasterization, and download/blob helpers.
A pure, framework-free library — React pieces belong in `@gum-jsx/react`. Core is a peer
dependency (`^1.9.0`, versioned in lockstep): everything here reads an `Env`'s font registry
(`env.fonts`: `names`, `has`, `face`, `data`, `load`; `resolveEnv` from `@gum-jsx/core/env` gives
the default Env when none is passed), so faces a plugin registers (the KaTeX ones from
`@gum-jsx/math`) are covered without depending on the plugin. Math is only a `devDependency`, for
the tests. In the `gum-org` bun workspace both resolve to the sibling checkouts.

It replaces what the studio (`~/mlai/gum`), the blog and `gum.tex` each carried by hand: the
`@font-face` CSS files (which had drifted from each other), a fonts-ready gate, and the studio's
`libs/render.ts` and `libs/utils.ts`. Encoders built on the pixels (the studio's GIF via
`gifenc`, its raster PDF) stay with the apps: they are not general enough to ship here.

## Layout

- `src/fonts.ts` - `loadedFaces(names?, env?)` enumerates an Env's loaded registry as CSS faces (one per file; a light/regular/bold set becomes three, a `faces` mapping carries its family/weight/style); `installFontFaces(names?, env?)` adds them to `document.fonts` once each (a no-op outside a browser); `loadWebFonts(names?, env?)` is `env.loadFonts` + `installFontFaces`
- `src/embed.ts` - `fontCss(names?, env?)` builds cached data-url `@font-face` rules from the loaded faces; `embedFonts(svg, names?, env?)` puts them in an `Svg` element's `<style>` (via `clone`; the element's own Env) or after the opening tag of markup (`env`, default the default Env)
- `src/raster.ts` - `rasterizeSvg` (PNG `Blob`) and `rasterizePixels` (`ImageData`, what a GIF or PDF encoder consumes), the `@gum-jsx/node` interface plus `fonts`, `dpr` and `env`: the markup (fonts embedded, since an `<img>` renders in isolation) goes through a blob url into an `Image` and onto a canvas sized by `fitSize`. `drawSvgCanvas` returns the canvas for callers that want to keep drawing
- `src/files.ts` - `downloadFile`/`downloadSvg`, base64 and blob ↔ data-url conversions
- `src/index.ts` - `export *` of the four modules
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
  through the registry's `faces` to family `KaTeX_Math`, weight 700, italic. `loadedFaces` is the
  one place that translation happens; everything else consumes its output.
- Nothing here touches the DOM at import time, so the package is safe to import in node and in
  tests; the DOM-touching functions check for `document` and bail.
