// Animated GIF from a sequence of SVGs (browser), via gifenc
/// <reference path="./types/gifenc.d.ts" />

import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import type { Svg } from '@gum-jsx/core'
import type { Size } from '@gum-jsx/core/lib/types'
import { fitSize } from '@gum-jsx/core/eval'
import { rasterizePixels, type RasterizeArgs } from './raster'

interface GifArgs extends Omit<RasterizeArgs, 'dpr'> {
    delay?: number   // frame delay in ms (default: 100)
}

// every frame is fit into the first frame's box so they share a size
async function rasterizeGif(frames: (Svg | string)[], { delay = 100, size, ...args }: GifArgs = {}): Promise<Blob> {
    if (frames.length == 0) throw new Error('rasterizeGif needs at least one frame')

    const gif = GIFEncoder()
    let box: Size | undefined
    for (const frame of frames) {
        const image = await rasterizePixels(frame, { size: box ?? size, ...args })
        const { width, height, data } = image
        box ??= [ width, height ]
        const pixels = new Uint8Array(data.buffer)
        const palette = quantize(pixels, 256)
        const index = applyPalette(pixels, palette)
        gif.writeFrame(index, width, height, { palette, delay })
    }
    gif.finish()

    return new Blob([ gif.bytesView() as BlobPart ], { type: 'image/gif' })
}

export { rasterizeGif }
export type { GifArgs }
