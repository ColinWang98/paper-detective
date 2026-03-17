import { dbHelpers } from '@/lib/db';
import { aiService } from '@/services/aiService';
import { CaseSetupService, caseSetupService } from '@/services/caseSetupService';

jest.mock('@/lib/db');
jest.mock('@/services/aiService');

const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>;
const mockAiService = aiService as jest.Mocked<typeof aiService>;

describe('CaseSetupService', () => {
  let service: CaseSetupService;

  const paperId = 42;
  const pdfText = 'Introduction\nWe solve a difficult problem.\nMethod\nWe introduce a new system.';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CaseSetupService();
    mockDbHelpers.getCaseSetup.mockResolvedValue(undefined);
    mockDbHelpers.saveCaseSetup.mockResolvedValue(1);
  });

  it('requests structure nodes and investigation tasks from the AI layer', async () => {
    mockAiService.generateStructuredData.mockResolvedValue({
      caseTitle: 'The Novelty Question',
      caseBackground: 'A paper makes a strong claim.',
      coreDispute: 'Whether the method is truly new.',
      openingJudgment: 'The result looks promising but unproven.',
      investigationGoal: 'Verify the paper with direct evidence.',
      structureNodes: [
        {
          id: 'intro-1',
          kind: 'intro',
          title: 'Introduction',
          summary: 'Introduces the problem.',
          pageHints: [1],
          importance: 'critical',
        },
      ],
      tasks: [
        {
          id: 'task-1',
          title: 'Define the Case',
          question: 'What problem does the paper claim to solve?',
          narrativeHook: 'Start with the central claim.',
          linkedStructureKinds: ['intro'],
          requiredEvidenceTypes: ['claim'],
          minEvidenceCount: 1,
          unlocksTaskIds: ['task-2'],
        },
      ],
    });

    await service.generateCaseSetup({ paperId, pdfText });

    expect(mockAiService.generateStructuredData).toHaveBeenCalledWith(
      expect.objectContaining({
        maxTokens: 2000,
        prompt: expect.stringContaining('section map of the paper'),
      })
    );
    expect(mockAiService.generateStructuredData).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('structured JSON only'),
      })
    );
  });

  it('normalizes AI output into a persisted case setup', async () => {
    mockAiService.generateStructuredData.mockResolvedValue({
      caseTitle: 'The Novelty Question',
      caseBackground: 'A paper makes a strong claim.',
      coreDispute: 'Whether the method is truly new.',
      openingJudgment: 'The result looks promising but unproven.',
      investigationGoal: 'Verify the paper with direct evidence.',
      structureNodes: [
        {
          id: 'intro-1',
          kind: 'intro',
          title: 'Introduction',
          summary: 'Introduces the problem.',
          pageHints: [1],
          importance: 'critical',
        },
      ],
      tasks: [
        {
          id: 'task-1',
          title: 'Define the Case',
          question: 'What problem does the paper claim to solve?',
          narrativeHook: 'Start with the central claim.',
          linkedStructureKinds: ['intro'],
          requiredEvidenceTypes: ['claim'],
          minEvidenceCount: 1,
          unlocksTaskIds: ['task-2'],
        },
      ],
    });

    const result = await service.generateCaseSetup({ paperId, pdfText });

    expect(result).toMatchObject({
      paperId,
      caseTitle: 'The Novelty Question',
      source: 'ai-generated',
      model: 'glm-4.7-flash',
    });
    expect(result.structureNodes[0]).toMatchObject({
      kind: 'intro',
      status: 'unseen',
    });
    expect(result.tasks[0]).toMatchObject({
      status: 'available',
      minEvidenceCount: 1,
    });
    expect(mockDbHelpers.saveCaseSetup).toHaveBeenCalledWith(result);
  });

  it('reuses cached case setup for repeated requests', async () => {
    const cachedSetup = {
      id: 8,
      paperId,
      caseTitle: 'Cached Setup',
      caseBackground: 'Cached background',
      coreDispute: 'Cached dispute',
      openingJudgment: 'Cached judgment',
      investigationGoal: 'Cached goal',
      structureNodes: [],
      tasks: [],
      generatedAt: '2026-03-17T00:00:00.000Z',
      model: 'glm-4.7-flash' as const,
      source: 'cache' as const,
    };

    mockDbHelpers.getCaseSetup.mockResolvedValue(cachedSetup);

    const result = await service.generateCaseSetup({ paperId, pdfText });

    expect(result).toEqual(cachedSetup);
    expect(mockAiService.generateStructuredData).not.toHaveBeenCalled();
    expect(mockDbHelpers.saveCaseSetup).not.toHaveBeenCalled();
  });

  it('exports a singleton instance', () => {
    expect(caseSetupService).toBeInstanceOf(CaseSetupService);
  });
});
