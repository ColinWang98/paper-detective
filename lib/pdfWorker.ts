export function getPdfWorkerSrc(_version: string): string {
  return new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
}
