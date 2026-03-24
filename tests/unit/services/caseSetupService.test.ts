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
  const frameResponse = {
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
  };
  const aiTasks = Array.from({ length: 6 }, (_, index) => ({
    id: `task-${index + 1}`,
    title: `Paper-specific task ${index + 1}`,
    question: `What does the paper specifically say about point ${index + 1}?`,
    narrativeHook: `Inspect the evidence for point ${index + 1}.`,
    section: index < 2 ? 'intro' : index < 4 ? 'method' : 'result',
    whereToLook: index < 2 ? ['Introduction'] : index < 4 ? ['Method'] : ['Results'],
    whatToFind: `Paper-specific evidence ${index + 1}.`,
    submissionMode: 'evidence_only',
    recommendedEvidenceCount: 1,
    evaluationFocus: `Whether evidence ${index + 1} is grounded in the paper.`,
    linkedStructureKinds: index < 2 ? ['intro'] : index < 4 ? ['method'] : ['result'],
    requiredEvidenceTypes: index < 2 ? ['claim'] : index < 4 ? ['method'] : ['result'],
    minEvidenceCount: 1,
    unlocksTaskIds: index < 5 ? [`task-${index + 2}`] : [],
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiService.generateStructuredData.mockReset();
    mockAiService.generateText.mockReset();
    service = new CaseSetupService();
    mockDbHelpers.getCaseSetup.mockResolvedValue(undefined);
    mockDbHelpers.saveCaseSetup.mockResolvedValue(1);
  });

  it('requests case framing first and tasks second from the AI layer', async () => {
    mockAiService.generateStructuredData
      .mockResolvedValueOnce(frameResponse)
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(4, 6) });

    await service.generateCaseSetup({ paperId, pdfText });

    expect(mockAiService.generateStructuredData).toHaveBeenCalledTimes(4);
    expect(mockAiService.generateStructuredData).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        maxTokens: 1600,
        prompt: expect.stringContaining('case framing and section map'),
      })
    );
    expect(mockAiService.generateStructuredData).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        prompt: expect.stringContaining('Paper digest:'),
      })
    );
    expect(mockAiService.generateStructuredData).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        maxTokens: 1200,
        prompt: expect.stringContaining('Generate investigation tasks for these sections'),
      })
    );
    expect(mockAiService.generateStructuredData).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        maxTokens: 1200,
        prompt: expect.stringContaining('"method"'),
      })
    );
    expect(mockAiService.generateStructuredData).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        maxTokens: 1200,
        prompt: expect.stringContaining('"result"'),
      })
    );
  });

  it('retries case framing with a smaller context when the upstream request fails', async () => {
    mockAiService.generateStructuredData
      .mockRejectedValueOnce({
        code: 'NETWORK_ERROR',
        message: 'network failed',
      })
      .mockResolvedValueOnce(frameResponse)
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(4, 6) });

    const result = await service.generateCaseSetup({
      paperId,
      pdfText: [
        'Abstract',
        'This is the abstract.',
        'Introduction',
        'A long introduction.',
        'Method',
        'A long method section.',
        'Results',
        'A long results section.',
        'Discussion',
        'A long discussion section.',
      ].join('\n'),
    });

    expect(result.caseTitle).toBe('The Novelty Question');
    expect(mockAiService.generateStructuredData).toHaveBeenCalledTimes(5);
    expect(mockAiService.generateStructuredData).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        prompt: expect.stringContaining('Compression mode: compact'),
      })
    );
  });

  it('normalizes AI output into a persisted case setup', async () => {
    mockAiService.generateStructuredData
      .mockResolvedValueOnce(frameResponse)
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(4, 6) });

    const result = await service.generateCaseSetup({ paperId, pdfText });

    expect(result).toMatchObject({
      paperId,
      caseTitle: 'The Novelty Question',
      source: 'ai-generated',
      model: 'deepseek-chat',
    });
    expect(result.structureNodes[0]).toMatchObject({
      kind: 'intro',
      status: 'unseen',
    });
    expect(result.tasks[0]).toMatchObject({
      status: 'available',
      minEvidenceCount: 1,
      title: 'Paper-specific task 1',
    });
    expect(mockDbHelpers.saveCaseSetup).toHaveBeenCalledWith(result);
  });

  it('combines multiple section-focused task batches into one task set', async () => {
    mockAiService.generateStructuredData
      .mockResolvedValueOnce(frameResponse)
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(4, 6) });

    const result = await service.generateCaseSetup({ paperId, pdfText });

    expect(mockAiService.generateStructuredData).toHaveBeenCalledTimes(4);
    expect(result.tasks).toHaveLength(6);
  });

  it('fills structure nodes from extracted paper text when AI omits them', async () => {
    mockAiService.generateStructuredData
      .mockResolvedValueOnce({
        caseTitle: 'The Novelty Question',
        caseBackground: 'A paper makes a strong claim.',
        coreDispute: 'Whether the method is truly new.',
        openingJudgment: 'The result looks promising but unproven.',
        investigationGoal: 'Verify the paper with direct evidence.',
      })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(4, 6) });

    const result = await service.generateCaseSetup({
      paperId,
      pdfText: 'Introduction\nA claim.\nRelated Work\nPrior systems.\nMethod\nA new model.\nResults\nStrong results.',
    });

    expect(result.structureNodes.length).toBeGreaterThan(0);
    expect(result.structureNodes.map((node) => node.kind)).toEqual(
      expect.arrayContaining(['intro', 'related-work', 'method', 'result'])
    );
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

  it('does not touch IndexedDB when running without window', async () => {
    mockAiService.generateStructuredData
      .mockResolvedValueOnce({
        ...frameResponse,
        caseTitle: 'Server Side Setup',
      })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(4, 6) });
    jest
      .spyOn(service as unknown as { canUseIndexedDb: () => boolean }, 'canUseIndexedDb')
      .mockReturnValue(false);

    const result = await service.generateCaseSetup({ paperId, pdfText });

    expect(result.caseTitle).toBe('Server Side Setup');
    expect(mockDbHelpers.getCaseSetup).not.toHaveBeenCalled();
    expect(mockDbHelpers.saveCaseSetup).not.toHaveBeenCalled();
  });

  it('surfaces parse errors from the task-generation pass instead of falling back to generic tasks', async () => {
    mockAiService.generateStructuredData
      .mockResolvedValueOnce(frameResponse)
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockRejectedValueOnce({
        code: 'PARSE_ERROR',
        message: 'Structured AI response did not contain valid JSON',
      })
      .mockRejectedValueOnce({
        code: 'PARSE_ERROR',
        message: 'Structured AI response did not contain valid JSON',
      });

    await expect(
      service.generateCaseSetup({
        paperId,
        pdfText: 'Test Paper Title\nIntroduction\nWe solve a difficult problem.\nMethod\nWe introduce a new system.\nResults\nIt works.',
      })
    ).rejects.toMatchObject({
      code: 'PARSE_ERROR',
    });

    expect(mockDbHelpers.saveCaseSetup).not.toHaveBeenCalled();
  });

  it('retries a failed task batch one section at a time before giving up', async () => {
    mockAiService.generateStructuredData
      .mockResolvedValueOnce(frameResponse)
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockRejectedValueOnce({
        code: 'PARSE_ERROR',
        message: 'Structured AI response did not contain valid JSON',
      })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(4, 6) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(6, 8) });

    const result = await service.generateCaseSetup({ paperId, pdfText });

    expect(result.tasks).toHaveLength(6);
    expect(mockAiService.generateStructuredData).toHaveBeenCalledTimes(6);
    expect(mockAiService.generateStructuredData).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        maxTokens: 900,
        prompt: expect.stringContaining('"result"'),
      })
    );
    expect(mockAiService.generateStructuredData).toHaveBeenNthCalledWith(
      6,
      expect.objectContaining({
        maxTokens: 900,
        prompt: expect.stringContaining('"discussion"'),
      })
    );
  });

  it('recovers from parse errors by extracting loose JSON objects from raw text', async () => {
    mockAiService.generateStructuredData
      .mockRejectedValueOnce({
        code: 'PARSE_ERROR',
        message: 'Structured AI response did not contain valid JSON',
      })
      .mockRejectedValueOnce({
        code: 'PARSE_ERROR',
        message: 'Structured AI response did not contain valid JSON',
      })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(4, 6) });

    mockAiService.generateText.mockResolvedValueOnce(
      "Here is the frame: {caseTitle:'Recovered Case',caseBackground:'Recovered background',coreDispute:'Recovered dispute',openingJudgment:'Recovered judgment',investigationGoal:'Recovered goal',structureNodes:[{id:'intro-1',kind:'intro',title:'Introduction',summary:'Recovered summary',importance:'critical'}]}"
    );

    const result = await service.generateCaseSetup({ paperId, pdfText });

    expect(result.caseTitle).toBe('Recovered Case');
    expect(result.structureNodes.length).toBeGreaterThan(0);
    expect(result.tasks).toHaveLength(6);
    expect(mockAiService.generateText).toHaveBeenCalledTimes(1);
  });

  it('falls back to a local case frame when AI frame parsing fails completely', async () => {
    mockAiService.generateStructuredData
      .mockRejectedValueOnce({
        code: 'PARSE_ERROR',
        message: 'Structured AI response did not contain valid JSON',
      })
      .mockRejectedValueOnce({
        code: 'PARSE_ERROR',
        message: 'Structured AI response did not contain valid JSON',
      })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(4, 6) });

    mockAiService.generateText
      .mockResolvedValueOnce('not a recoverable frame')
      .mockResolvedValueOnce('still not a tagged frame');

    const result = await service.generateCaseSetup({
      paperId,
      pdfText: 'Test Paper Title\nIntroduction\nWe solve a difficult problem.\nMethod\nWe introduce a new system.\nResults\nIt works.',
    });

    expect(result.caseTitle).toContain('Test Paper Title');
    expect(result.coreDispute).toContain('claim');
    expect(result.tasks).toHaveLength(6);
  });

  it('recovers frame data from tagged plain-text blocks when JSON parsing fails', async () => {
    mockAiService.generateStructuredData
      .mockRejectedValueOnce({
        code: 'PARSE_ERROR',
        message: 'Structured AI response did not contain valid JSON',
      })
      .mockRejectedValueOnce({
        code: 'PARSE_ERROR',
        message: 'Structured AI response did not contain valid JSON',
      })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(4, 6) });

    mockAiService.generateText
      .mockResolvedValueOnce('not json at all')
      .mockResolvedValueOnce([
        'CASE_TITLE: Tagged Frame Case',
        'CASE_BACKGROUND: The paper makes a bold claim.',
        'CORE_DISPUTE: Whether the claimed novelty is real.',
        'OPENING_JUDGMENT: The evidence looks plausible but incomplete.',
        'INVESTIGATION_GOAL: Verify the claim with direct evidence.',
        'STRUCTURE_NODE: intro | Introduction | Opening claim and motivation. | critical',
      ].join('\n'));

    const result = await service.generateCaseSetup({ paperId, pdfText });

    expect(result.caseTitle).toBe('Tagged Frame Case');
    expect(result.structureNodes[0].kind).toBe('intro');
    expect(mockAiService.generateText).toHaveBeenCalledTimes(2);
  });

  it('recovers from parse errors by parsing tagged plain-text task blocks', async () => {
    mockAiService.generateStructuredData
      .mockResolvedValueOnce(frameResponse)
      .mockRejectedValueOnce({
        code: 'PARSE_ERROR',
        message: 'Structured AI response did not contain valid JSON',
      })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(4, 6) });

    mockAiService.generateText
      .mockResolvedValueOnce('not json at all')
      .mockResolvedValueOnce([
        'TASK',
        'title: Recovered intro task',
        'question: What exact claim is stated in the introduction?',
        'narrativeHook: Start from the opening claim.',
        'section: intro',
        'whereToLook: Abstract | Introduction',
        'whatToFind: The exact core claim wording.',
        'submissionMode: evidence_only',
        'recommendedEvidenceCount: 1',
        'evaluationFocus: Whether the evidence quotes the claim precisely.',
        'linkedStructureKinds: intro',
        'requiredEvidenceTypes: claim',
        'minEvidenceCount: 1',
        '',
        'TASK',
        'title: Recovered related task',
        'question: Which prior work is the closest comparison?',
        'narrativeHook: Find the nearest baseline.',
        'section: related-work',
        'whereToLook: Related Work',
        'whatToFind: The closest baseline or prior method.',
        'submissionMode: evidence_only',
        'recommendedEvidenceCount: 1',
        'evaluationFocus: Whether the evidence identifies the closest prior work.',
        'linkedStructureKinds: related-work',
        'requiredEvidenceTypes: comparison',
        'minEvidenceCount: 1',
      ].join('\n'));

    const result = await service.generateCaseSetup({ paperId, pdfText });

    expect(result.tasks).toHaveLength(6);
    expect(result.tasks[0].title).toBe('Recovered intro task');
    expect(mockAiService.generateText).toHaveBeenCalledTimes(2);
  });

  it('does not hide non-parse AI failures behind fallback data', async () => {
    mockAiService.generateStructuredData
      .mockResolvedValueOnce(frameResponse)
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 4) })
      .mockRejectedValueOnce({
        code: 'NETWORK_ERROR',
        message: 'network failed',
      });

    await expect(service.generateCaseSetup({ paperId, pdfText })).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('supplements missing tasks with a final plain-text recovery pass', async () => {
    mockAiService.generateStructuredData
      .mockResolvedValueOnce(frameResponse)
      .mockResolvedValueOnce({ tasks: aiTasks.slice(0, 1) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(1, 2) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(2, 3) });

    mockAiService.generateText.mockResolvedValueOnce([
      'TASK: Supplemental result check || Does the result section directly support the main claim? || result || Results | Experiment || The strongest result supporting the claim || evidence_plus_optional_judgment || result || 1 || Whether the cited result directly supports the claim.',
      'TASK: Supplemental fairness check || Is the comparison setup fair? || result || Experiment | Results || Baselines or dataset choices affecting fairness || evidence_plus_optional_judgment || comparison|result || 2 || Whether the evidence supports a fairness judgment.',
      'TASK: Supplemental limitation check || What limitation most weakens confidence? || discussion || Discussion | Limitation || The most important unresolved limitation || evidence_plus_optional_judgment || limitation || 1 || Whether the evidence identifies the key limitation.',
    ].join('\n'));

    const result = await service.generateCaseSetup({ paperId, pdfText });

    expect(result.tasks).toHaveLength(6);
    expect(result.tasks[3].title).toBe('Supplemental result check');
    expect(mockAiService.generateText).toHaveBeenCalledTimes(1);
  });

  it('fills incomplete task fields from fallback values instead of failing the whole setup', async () => {
    mockAiService.generateStructuredData
      .mockResolvedValueOnce(frameResponse)
      .mockResolvedValueOnce({
        tasks: [
          {
            id: 'task-1',
            title: 'Paper-specific partial task',
            section: 'intro',
          },
          ...aiTasks.slice(1, 3),
        ],
      })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(3, 5) })
      .mockResolvedValueOnce({ tasks: aiTasks.slice(5, 7) });

    const result = await service.generateCaseSetup({ paperId, pdfText });

    expect(result.tasks[0].title).toBe('Paper-specific partial task');
    expect(result.tasks[0].question).toBeTruthy();
    expect(result.tasks[0].whatToFind).toBeTruthy();
    expect(result.tasks.length).toBeGreaterThanOrEqual(6);
  });

  it('exports a singleton instance', () => {
    expect(caseSetupService).toBeInstanceOf(CaseSetupService);
  });
});
