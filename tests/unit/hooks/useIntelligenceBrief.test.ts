import { renderHook, waitFor } from '@testing-library/react';

import { useIntelligenceBrief } from '@/hooks/useIntelligenceBrief';
import { usePaperStore } from '@/lib/store';
import {
  completeBrief,
  minimalBrief,
  noAuthorsBrief,
  specialCharacterBrief,
} from '../../fixtures/export-data';

jest.mock('@/lib/store');

jest.mock('@/lib/pdf', () => ({
  extractPDFText: jest.fn(() => Promise.resolve('PDF text content')),
}));

const mockUsePaperStore = usePaperStore as unknown as jest.Mock;

function createJsonResponse(payload: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: jest.fn().mockResolvedValue(payload),
  } as any;
}

describe('useIntelligenceBrief', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePaperStore.mockReturnValue({
      currentPaper: { id: 142 },
      highlights: [],
      caseSetup: null,
    });
    global.fetch = jest.fn();
  });

  async function renderHookWithCachedBrief(brief = completeBrief) {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse({ success: true, data: brief })
    );

    const result = renderHook(() => useIntelligenceBrief());

    await waitFor(() => {
      expect(result.result.current.brief).toEqual(brief);
    });

    return result.result;
  }

  it('loads a cached brief on mount and exposes success state', async () => {
    const result = await renderHookWithCachedBrief();

    expect(global.fetch).toHaveBeenCalledWith('/api/ai/intelligence-brief?paperId=142');
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.hasBrief).toBe(true);
    expect(result.current.progress).toBe(100);
  });

  it('returns null exports when no cached brief is available', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse({ success: false, data: null })
    );

    const { result } = renderHook(() => useIntelligenceBrief({ mode: 'final-report' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(result.current.brief).toBeNull();
    expect(result.current.exportAsMarkdown()).toBeNull();
    expect(result.current.exportAsBibTeX()).toBeNull();
  });

  it('exports markdown from the cached brief content', async () => {
    const result = await renderHookWithCachedBrief();

    const markdown = result.current.exportAsMarkdown();

    expect(markdown).not.toBeNull();
    expect(markdown).toContain('# Advanced Deep Learning Techniques for Computer Vision');
    expect(markdown).toContain('#142');
    expect(markdown).toContain('John Smith, Jane Doe, Robert Johnson');
    expect(markdown).toContain('How can deep learning improve computer vision accuracy?');
    expect(markdown).toContain('This study explores advanced deep learning techniques.');
    expect(markdown).toContain('Key finding: Attention mechanisms improve interpretability');
    expect(markdown).toContain('glm-4.7-flash');
    expect(markdown).toContain('3700');
  });

  it('includes clue cards and user highlights in markdown when present', async () => {
    const result = await renderHookWithCachedBrief();

    const markdown = result.current.exportAsMarkdown();

    expect(markdown).toContain('How can deep learning improve computer vision accuracy?');
    expect(markdown).toContain('ResNet-50 with 50 layers and skip connections');
    expect(markdown).toContain('CNNs achieved 95% accuracy on ImageNet benchmark dataset');
    expect(markdown).toContain('Key finding: Attention mechanisms improve interpretability');
    expect(markdown).toContain('Methodology uses transfer learning for efficiency');
  });

  it('still exports markdown for a minimal brief', async () => {
    const result = await renderHookWithCachedBrief(minimalBrief);

    const markdown = result.current.exportAsMarkdown();

    expect(markdown).not.toBeNull();
    expect(markdown).toContain('# Minimal Study');
    expect(markdown).toContain('glm-4.7-flash');
  });

  it('exports BibTeX with author formatting, year, keywords, abstract, and model note', async () => {
    const result = await renderHookWithCachedBrief();

    const bibtex = result.current.exportAsBibTeX();

    expect(bibtex).not.toBeNull();
    expect(bibtex).toContain('@article{Smith2024_advanced,');
    expect(bibtex).toContain('author = {Smith, John and Doe, Jane and Johnson, Robert}');
    expect(bibtex).toContain('title = {Advanced Deep Learning Techniques for Computer Vision}');
    expect(bibtex).toContain('year = {2024}');
    expect(bibtex).toContain('keywords = {deep learning, computer vision, CNN}');
    expect(bibtex).toContain('abstract = {How can deep learning improve computer vision accuracy?}');
    expect(bibtex).toContain('note = {Analyzed with glm-4.7-flash}');
  });

  it('falls back to Unknown Author and n.d. in BibTeX when metadata is missing', async () => {
    const brief = {
      ...noAuthorsBrief,
      caseFile: {
        ...noAuthorsBrief.caseFile,
        publicationDate: undefined,
      },
    };
    const result = await renderHookWithCachedBrief(brief);

    const bibtex = result.current.exportAsBibTeX();

    expect(bibtex).toContain('author = {Unknown Author}');
    expect(bibtex).toContain('year = {n.d.}');
  });

  it('preserves special characters in exported content', async () => {
    const result = await renderHookWithCachedBrief(specialCharacterBrief);

    const markdown = result.current.exportAsMarkdown();
    const bibtex = result.current.exportAsBibTeX();

    expect(markdown).toContain('Study on "Deep Learning" & Neural Networks <AI/ML>');
    expect(bibtex).toContain('Study on "Deep Learning" & Neural Networks <AI/ML>');
  });

  it('keeps the final report locked until the completed-question threshold is reached', () => {
    mockUsePaperStore.mockReturnValue({
      currentPaper: { id: 142 },
      highlights: [],
      caseSetup: {
        tasks: Array.from({ length: 10 }, (_, index) => ({
          id: `task-${index + 1}`,
          title: `Task ${index + 1}`,
          question: `Question ${index + 1}`,
          narrativeHook: 'Hook',
          section: 'intro',
          whereToLook: ['Introduction'],
          whatToFind: 'Evidence',
          submissionMode: 'evidence_only',
          recommendedEvidenceCount: 1,
          evaluationFocus: 'coverage',
          linkedStructureKinds: ['intro'],
          requiredEvidenceTypes: ['claim'],
          minEvidenceCount: 1,
          unlocksTaskIds: [],
          status: index < 9 ? 'completed' : 'available',
        })),
      },
    });
    (global.fetch as jest.Mock).mockResolvedValue(createJsonResponse({ success: false, data: null }));

    const { result } = renderHook(() => useIntelligenceBrief({ mode: 'final-report' }));

    expect(result.current.isReportLocked).toBe(true);
  });

  it('unlocks the final report once the completed-question threshold is reached', () => {
    mockUsePaperStore.mockReturnValue({
      currentPaper: { id: 142 },
      highlights: [],
      caseSetup: {
        tasks: Array.from({ length: 10 }, (_, index) => ({
          id: `task-${index + 1}`,
          title: `Task ${index + 1}`,
          question: `Question ${index + 1}`,
          narrativeHook: 'Hook',
          section: 'intro',
          whereToLook: ['Introduction'],
          whatToFind: 'Evidence',
          submissionMode: 'evidence_only',
          recommendedEvidenceCount: 1,
          evaluationFocus: 'coverage',
          linkedStructureKinds: ['intro'],
          requiredEvidenceTypes: ['claim'],
          minEvidenceCount: 1,
          unlocksTaskIds: [],
          status: 'completed',
        })),
      },
    });
    (global.fetch as jest.Mock).mockResolvedValue(createJsonResponse({ success: false, data: null }));

    const { result } = renderHook(() => useIntelligenceBrief({ mode: 'final-report' }));

    expect(result.current.isReportLocked).toBe(false);
  });

  it('keeps direct AI brief mode unlocked even when investigation progress is incomplete', () => {
    mockUsePaperStore.mockReturnValue({
      currentPaper: { id: 142 },
      highlights: [],
      caseSetup: {
        tasks: Array.from({ length: 10 }, (_, index) => ({
          id: `task-${index + 1}`,
          title: `Task ${index + 1}`,
          question: `Question ${index + 1}`,
          narrativeHook: 'Hook',
          section: 'intro',
          whereToLook: ['Introduction'],
          whatToFind: 'Evidence',
          submissionMode: 'evidence_only',
          recommendedEvidenceCount: 1,
          evaluationFocus: 'coverage',
          linkedStructureKinds: ['intro'],
          requiredEvidenceTypes: ['claim'],
          minEvidenceCount: 1,
          unlocksTaskIds: [],
          status: index === 0 ? 'completed' : 'locked',
        })),
      },
    });
    (global.fetch as jest.Mock).mockResolvedValue(createJsonResponse({ success: false, data: null }));

    const { result } = renderHook(() => useIntelligenceBrief({ mode: 'direct-brief' }));

    expect(result.current.isReportLocked).toBe(false);
  });
});
