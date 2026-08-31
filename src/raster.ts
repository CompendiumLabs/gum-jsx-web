// Rasterizing SVG in the browser
//
// The same interface as @gum-jsx/node's rasterizeSvg/rasterizePixels, on a
// <canvas>: the SVG is loaded into an <img> through a blob url and drawn. An
// <img> renders in isolation from the page, so the fonts are embedded into
// the markup first (see embed.ts) unless the caller opts out.

import type { Svg } from '@gum-jsx/core'
import type { Env } from '@gum-jsx/core/env'
import type { Size } from '@gum-jsx/core/lib/types'
import { fitSize } from '@gum-jsx/core/eval'
import { embedFonts } from './embed'

interface RasterizeArgs {
    size?: Size | number       // fit the image into this box (default: the svg's own size)
    background?: string        // fill behind the drawing (default: transparent)
    fonts?: boolean | string[] // embed the loaded fonts (default), a list of families, or false
    dpr?: number               // device pixels per css pixel (default: 1)
    env?: Env                  // whose fonts markup names (default: the default Env; an element uses its own)
}

interface RasterizeResult {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    size: Size
}

function makeCanvas([ width, height ]: Size, dpr: number = 1): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.width = `${Math.round(width)}px`
    canvas.style.height = `${Math.round(height)}px`
    const ctx = canvas.getContext('2d')
    if (ctx == null) throw new Error('Could not create a 2d canvas context')
    ctx.scale(dpr, dpr)
    return { canvas, ctx }
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = url
    })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string = 'image/png'): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob != null ? resolve(blob) : reject(new Error('Failed to convert canvas to blob')), type)
    })
}

async function drawSvgCanvas(svg: Svg | string, { size, background, fonts = true, dpr = 1, env }: RasterizeArgs = {}): Promise<RasterizeResult> {
    // markup with the fonts inside it
    const names = Array.isArray(fonts) ? fonts : undefined
    const text = typeof svg == 'string'
        ? (fonts ? embedFonts(svg, names, env) : svg)
        : (fonts ? embedFonts(svg, names) : svg).svg()

    // load it as an image
    const url = URL.createObjectURL(new Blob([ text ], { type: 'image/svg+xml' }))
    let img: HTMLImageElement
    try {
        img = await loadImage(url)
    } finally {
        URL.revokeObjectURL(url)
    }

    // the output size: the element's own size where we have it, else the image's
    const own: Size = typeof svg == 'string' ? [ img.width, img.height ] : svg.size
    const out = fitSize(own, size)
    const [ width, height ] = out

    // draw
    const { canvas, ctx } = makeCanvas(out, dpr)
    if (background != null) {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(img, 0, 0, width, height)

    return { canvas, ctx, size: out }
}

// png as a Blob
async function rasterizeSvg(svg: Svg | string, args: RasterizeArgs = {}): Promise<Blob> {
    const { canvas } = await drawSvgCanvas(svg, args)
    return canvasToBlob(canvas)
}

// raw rgba pixels (at device resolution)
async function rasterizePixels(svg: Svg | string, args: RasterizeArgs = {}): Promise<ImageData> {
    const { canvas, ctx } = await drawSvgCanvas(svg, args)
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export { makeCanvas, loadImage, canvasToBlob, drawSvgCanvas, rasterizeSvg, rasterizePixels }
export type { RasterizeArgs, RasterizeResult }
