// The parts that run without a DOM: face enumeration, font embedding, base64
// and data-url helpers. The canvas rasterizer needs a browser; the studio's
// export pane and the blog exercise it.

import { strict as assert } from 'node:assert'

import { gum, sans, TEXT_FONTS } from '@gum-jsx/core'
import { evaluateGum } from '@gum-jsx/core/eval'
import { math, MATH_BASE_FONTS } from '@gum-jsx/math'

import { loadedFaces, installFontFaces, fontCss, embedFonts, toBase64, fromBase64, dataUrlToBlob, blobToDataUrl } from '../src/index'

let passed = 0
function test(name: string, fn: () => void | Promise<void>): Promise<void> {
    return Promise.resolve().then(fn).then(() => { console.log(`ok — ${name}`); passed++ })
}

gum.use(math)
await gum.loadFonts([ ...TEXT_FONTS, ...MATH_BASE_FONTS, 'KaTeX_Math-BoldItalic' ])

await test('loadedFaces: one css face per file, weights from the registry', () => {
    const faces = loadedFaces()
    const plex = faces.filter(f => f.family == sans)
    assert.deepEqual(plex.map(f => f.weight).sort(), [ 300, 400, 700 ])
    // a registry name that is its own family (the Math-Italic file is what the
    // svg calls KaTeX_Math) is upright at 400; one mapped through the plugin's
    // faces carries its family, weight and style
    const math = faces.find(f => f.key == 'KaTeX_Math')
    assert.deepEqual(math && [ math.family, math.weight, math.style ], [ 'KaTeX_Math', 400, 'normal' ])
    const boldItalic = faces.find(f => f.key == 'KaTeX_Math-BoldItalic')
    assert.deepEqual(boldItalic && [ boldItalic.family, boldItalic.weight, boldItalic.style ], [ 'KaTeX_Math', 700, 'italic' ])
    assert.ok(faces.every(f => f.data instanceof ArrayBuffer))
})

await test('loadedFaces: a name subset', () => {
    assert.equal(loadedFaces([ sans ]).length, 3)
    assert.equal(loadedFaces([ 'not-a-font' ]).length, 0)
})

await test('installFontFaces: a no-op outside the browser', () => {
    installFontFaces()
})

await test('fontCss: data-url @font-face rules', () => {
    const css = fontCss([ sans ])
    assert.equal((css.match(/@font-face/g) ?? []).length, 3)
    assert.ok(css.includes(`font-family:"${sans}"`) && css.includes('font-weight:300') && css.includes('data:font/ttf;base64,'))
    assert.equal(fontCss([ sans ]), css, 'rules are cached')
})

await test('embedFonts: element form carries the rules in its <style>', () => {
    const elem = evaluateGum('<Text>hello</Text>', { size: 200 })
    const out = embedFonts(elem, [ sans ]).svg()
    assert.ok(out.includes('<style>') && out.includes('@font-face') && out.includes('<text'))
    assert.ok(!elem.svg().includes('@font-face'), 'the original is untouched')
})

await test('embedFonts: string form inserts a <style> after the opening tag', () => {
    const svg = evaluateGum('<Text>hello</Text>', { size: 200 }).svg()
    const out = embedFonts(svg, [ sans ])
    assert.ok(/^<svg[^>]*>\n<style>\n@font-face/.test(out))
    assert.ok(out.endsWith('</svg>'))
})

await test('base64 and data urls round-trip', async () => {
    const bytes = new Uint8Array(70000).map((_, i) => i % 251)
    assert.deepEqual(fromBase64(toBase64(bytes.buffer)), bytes)
    const blob = new Blob([ bytes ], { type: 'application/octet-stream' })
    const url = await blobToDataUrl(blob)
    assert.ok(url.startsWith('data:application/octet-stream;base64,'))
    const back = dataUrlToBlob(url)
    assert.equal(back.type, 'application/octet-stream')
    assert.deepEqual(new Uint8Array(await back.arrayBuffer()), bytes)
})

console.log(`${passed} passed`)
