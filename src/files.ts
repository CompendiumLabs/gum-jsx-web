// Files in the browser: downloads and blob / data-url conversions

function toBase64(data: ArrayBuffer): string {
    const bytes = new Uint8Array(data)
    const chunk = 0x8000
    let binary = ''
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[])
    }
    return btoa(binary)
}

function fromBase64(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

// trigger a download of a blob or text (with its mime type) under a filename
function downloadFile(filename: string, data: Blob | string, type: string = 'text/plain'): void {
    const blob = typeof data == 'string' ? new Blob([ data ], { type }) : data
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

function downloadSvg(filename: string, svg: string): void {
    downloadFile(filename, svg, 'image/svg+xml')
}

async function blobToBase64(blob: Blob): Promise<string> {
    return toBase64(await blob.arrayBuffer())
}

async function blobToDataUrl(blob: Blob): Promise<string> {
    return `data:${blob.type};base64,${await blobToBase64(blob)}`
}

async function blobUrlToDataUrl(url: string): Promise<string> {
    const response = await fetch(url)
    return blobToDataUrl(await response.blob())
}

function dataUrlToBlob(dataUrl: string): Blob {
    const [ head, base64 ] = dataUrl.split(',')
    const type = head.replace(/^data:/, '').replace(/;base64$/, '')
    return new Blob([ fromBase64(base64) as BlobPart ], { type })
}

function dataUrlToBlobUrl(dataUrl: string): string {
    return URL.createObjectURL(dataUrlToBlob(dataUrl))
}

export { toBase64, fromBase64, downloadFile, downloadSvg, blobToBase64, blobToDataUrl, blobUrlToDataUrl, dataUrlToBlob, dataUrlToBlobUrl }
