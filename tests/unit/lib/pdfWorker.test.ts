import { getPdfWorkerSrc } from '@/lib/pdfWorker';

describe('getPdfWorkerSrc', () => {
  it('uses the locally bundled .mjs worker path for pdf.js runtimes', () => {
    const workerSrc = getPdfWorkerSrc('5.4.624');

    expect(workerSrc).toContain('pdf.worker.min.mjs');
    expect(workerSrc).not.toContain('cdnjs.cloudflare.com');
  });
});
