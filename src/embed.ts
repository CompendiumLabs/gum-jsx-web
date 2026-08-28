// Embedding fonts into SVG
//
// An SVG drawn through <img> (which is how the canvas rasterizer draws it) or
// opened as a file on its own cannot reach the page's fonts, so for its text to
// render in the faces gum measured with, the font data has to travel inside
// the SVG as data-url @font-face rules in its <style>. The rules are built
// from the loaded registry (FONT_DATA) and cached per face.

import type { Svg } from '@gum-jsx/core'
import { loadedFaces, type LoadedFace } from './fonts'

function toBase64(data: ArrayBuffer): string {
    const bytes = new Uint8Array(data)
    const chunk = 0x8000
    let binary = ''
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[])
    }
    return btoa(binary)
}

const RULES: Map<string, string> = new Map()

function fontFaceRule({ key, family, weight, style, data }: LoadedFace): string {
    let rule = RULES.get(key)
    if (rule == null) {
        const src = `url("data:font/ttf;base64,${toBase64(data)}") format("truetype")`
        const props = [ `font-family:${JSON.stringify(family)}`, `font-weight:${weight}`, `font-style:${style}`, `src:${src}` ]
        rule = `@font-face{${props.join(';')};}`
        RULES.set(key, rule)
    }
    return rule
}

// the @font-face rules for the loaded faces (default: everything loaded); a
// full set is a few hundred kB, so pass the families the SVG actually uses
// where that is known
function fontCss(names?: string[]): string {
    return loadedFaces(names).map(fontFaceRule).join('\n')
}

// a copy of the element (or markup) whose <style> carries the font rules
function embedFonts(svg: Svg, names?: string[]): Svg
function embedFonts(svg: string, names?: string[]): string
function embedFonts(svg: Svg | string, names?: string[]): Svg | string {
    const css = fontCss(names)
    if (typeof svg == 'string') {
        return svg.replace(/<svg\b[^>]*>/, tag => `${tag}\n<style>\n${css}\n</style>`)
    } else {
        const text = svg.style.text
        const style = text.length > 0 ? `${text}\n${css}` : css
        return svg.clone({ style }) as Svg
    }
}

export { fontCss, embedFonts }
