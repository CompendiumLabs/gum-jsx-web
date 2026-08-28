// the parts of gifenc (https://github.com/mattdesl/gifenc) used by gif.ts
declare module 'gifenc' {
    type Palette = number[][]

    interface FrameOptions {
        palette?: Palette
        delay?: number
        transparent?: boolean
        transparentIndex?: number
        repeat?: number
        dispose?: number
        first?: boolean
    }

    interface Encoder {
        writeFrame(index: Uint8Array, width: number, height: number, opts?: FrameOptions): void
        finish(): void
        bytes(): Uint8Array
        bytesView(): Uint8Array
        reset(): void
    }

    function GIFEncoder(opts?: { auto?: boolean, initialCapacity?: number }): Encoder
    function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, opts?: { format?: 'rgb565' | 'rgb444' | 'rgba4444', oneBitAlpha?: boolean | number, clearAlpha?: boolean, clearAlphaThreshold?: number, clearAlphaColor?: number }): Palette
    function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: 'rgb565' | 'rgb444' | 'rgba4444'): Uint8Array
    function nearestColorIndex(palette: Palette, pixel: number[]): number
}
