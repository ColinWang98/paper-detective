import { getPdfWorkerSrc } from '@/lib/pdfWorker';

describe('getPdfWorkerSrc', () => {
  it('uses the app hosted worker path so dev and standalone share one worker asset', () => {
    const workerSrc = getPdfWorkerSrc('4.8.69');

    expect(workerSrc).toBe('/pdf.worker.min.mjs');
    expect(workerSrc).not.toContain('cdnjs.cloudflare.com');
  });
});
