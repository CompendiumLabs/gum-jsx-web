// Font installation for the browser
//
// gum measures text with real font metrics (opentype.js), so a host must
// env.loadFonts() before evaluating. Once loaded, core holds the bytes — and
// the page needs the same faces to *draw* the SVG that gum emits, which names
// them by CSS face (family + weight/style, see FontRegistry.face in
// @gum-jsx/core/fonts). Rather than writing @font-face rules with urls (a
// second fetch per file, and a list that drifts from the registry), hand the
// bytes gum already has to the browser through the FontFace API. Faces arrive
// incrementally (a plugin registers its own; the extra math faces only load
// when a formula needs them), so installFontFaces is idempotent and cheap to
// call after every load. Everything here reads the registry of the Env it is
// given (default: the default Env).

import type { FontWeight } from '@gum-jsx/core/fonts'
import { resolveEnv, type Env } from '@gum-jsx/core/env'
import { light, regular, bold } from '@gum-jsx/core/lib/const'

const WEIGHTS: Record<FontWeight, number> = { light, regular, bold }

// one css face: what a @font-face rule or a FontFace needs
interface LoadedFace {
    key: string          // registry name, plus the weight for a light/regular/bold set
    family: string
    weight: number
    style: 'normal' | 'italic'
    data: ArrayBuffer
}

// the css faces behind the loaded registry names (default: everything loaded)
function loadedFaces(names?: string[], env?: Env): LoadedFace[] {
    const { fonts } = resolveEnv(env)
    const faces: LoadedFace[] = []
    for (const name of names ?? fonts.names()) {
        if (!fonts.has(name)) continue
        const data = fonts.data(name)
        if (data == null) continue
        if (data instanceof ArrayBuffer) {
            const { family, weight = regular, style = 'normal' } = fonts.face(name)
            faces.push({ key: name, family, weight, style, data })
        } else {
            for (const [ weight, buf ] of Object.entries(data) as [ FontWeight, ArrayBuffer ][]) {
                faces.push({ key: `${name}:${weight}`, family: name, weight: WEIGHTS[weight], style: 'normal', data: buf })
            }
        }
    }
    return faces
}

// faces handed to document.fonts so far
const installed: Set<string> = new Set()

// register every loaded face (default: everything loaded) with the document;
// safe to call repeatedly and outside a browser (where it does nothing)
function installFontFaces(names?: string[], env?: Env): void {
    if (typeof document == 'undefined' || typeof FontFace == 'undefined') return
    // (lib.dom types FontFaceSet without its Set methods)
    const fonts = document.fonts as FontFaceSet & { add(face: FontFace): void }
    for (const { key, family, weight, style, data } of loadedFaces(names, env)) {
        if (installed.has(key)) continue
        fonts.add(new FontFace(family, data, { weight: String(weight), style }))
        installed.add(key)
    }
}

// load fonts (default: everything registered, memoized per file by core) and
// install them for drawing; await this once before the first evaluation, and
// again after registering more faces
async function loadWebFonts(names?: string | string[], env?: Env): Promise<void> {
    await resolveEnv(env).loadFonts(names)
    installFontFaces(undefined, env)
}

export { loadedFaces, installFontFaces, loadWebFonts }
export type { LoadedFace }
