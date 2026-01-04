import { createGzip, createDeflate, createBrotliCompress } from 'node:zlib'

function createCompressionStream(format: string) {
  let handler
  if (format === 'gzip') {
    handler = createGzip()
  } else if (format === 'deflate') {
    handler = createDeflate()
  } else if (format === 'br') {
    handler = createBrotliCompress()
  } else {
    throw new Error(`Unsupported compression format: ${format}`)
  }

  const readableStream = new ReadableStream({
    start(controller) {
      handler.on('data', chunk => controller.enqueue(chunk))
      handler.on('end', () => controller.close())
      handler.on('error', err => controller.error(err))
    }
  })

  const writableStream = new WritableStream({
    write(chunk) {
      handler.write(chunk)
    },
    close() {
      handler.end()
    }
  })

  return { readable: readableStream, writable: writableStream }
}

// ✅ Polyfill `CompressionStream` if missing
if (typeof globalThis.CompressionStream === 'undefined') {
  class CompressionStream {
    readable: ReadableStream
    writable: WritableStream
    constructor(format: string) {
      const { readable, writable } = createCompressionStream(format)
      this.readable = readable
      this.writable = writable
    }
  }
  globalThis.CompressionStream = CompressionStream
}
