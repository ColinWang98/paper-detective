import { dbHelpers } from '@/lib/db';
import type {
  CaseSetup,
  DoctorState,
  EvidenceType,
  InvestigationTask,
  PaperStructureKind,
  PaperStructureNode,
  QuestionNode,
  QuestionRelation,
  QuestionRelationType,
  QuestionSection,
} from '@/types';

import { aiService } from './aiService';
import { DEFAULT_AI_MODEL } from './aiProvider';

interface GenerateCaseSetupOptions {
  paperId: number;
  pdfText: string;
  forceRegenerate?: boolean;
  apiKey?: string;
  model?: string;
}

interface RawCaseSetup {
  caseTitle?: string;
  caseBackground?: string;
  coreDispute?: string;
  openingJudgment?: string;
  investigationGoal?: string;
  structureNodes?: Array<Partial<PaperStructureNode>>;
}

interface RawTaskSet {
  tasks?: Array<Partial<InvestigationTask>>;
}

const MIN_TASK_COUNT = 6;
const MAX_TASK_COUNT = 10;
const TASK_BATCHES: QuestionSection[][] = [
  ['intro', 'related-work'],
  ['method'],
  ['result', 'discussion'],
];

const DEFAULT_TASKS: Array<Omit<InvestigationTask, 'status'>> = [
  {
    id: 'task-define-case',
    title: 'Lock the Core Claim',
    question: 'Find the exact problem statement and the main claim the authors want you to believe.',
    narrativeHook: 'Start in the Introduction. Your first job is to pin down the claim in the authors\' own words.',
    section: 'intro',
    whereToLook: ['Abstract', 'Introduction'],
    whatToFind: 'The exact wording of the core research problem and central claim.',
    submissionMode: 'evidence_only',
    recommendedEvidenceCount: 1,
    evaluationFocus: 'Whether the submitted evidence captures the claim precisely.',
    linkedStructureKinds: ['intro'],
    requiredEvidenceTypes: ['claim'],
    minEvidenceCount: 1,
    unlocksTaskIds: ['task-real-innovation'],
  },
  {
    id: 'task-problem-scope',
    title: 'Map the Problem Scope',
    question: 'What exact scope or context does the paper set for the problem it tackles?',
    narrativeHook: 'Check how the authors narrow the problem. Scope often hides the real constraints.',
    section: 'intro',
    whereToLook: ['Introduction'],
    whatToFind: 'Sentences that define the problem boundary, assumptions, or target setting.',
    submissionMode: 'evidence_only',
    recommendedEvidenceCount: 1,
    evaluationFocus: 'Whether the evidence captures scope rather than generic motivation.',
    linkedStructureKinds: ['intro'],
    requiredEvidenceTypes: ['claim'],
    minEvidenceCount: 1,
    unlocksTaskIds: [],
  },
  {
    id: 'task-closest-prior-work',
    title: 'Find the Closest Prior Work',
    question: 'Which prior method is the closest baseline or conceptual neighbor to this paper?',
    narrativeHook: 'Related Work is where inflated novelty starts to break down.',
    section: 'related-work',
    whereToLook: ['Related Work'],
    whatToFind: 'The prior method the paper is most directly competing with.',
    submissionMode: 'evidence_only',
    recommendedEvidenceCount: 1,
    evaluationFocus: 'Whether the chosen prior work is actually the closest relevant comparison.',
    linkedStructureKinds: ['related-work'],
    requiredEvidenceTypes: ['comparison'],
    minEvidenceCount: 1,
    unlocksTaskIds: [],
  },
  {
    id: 'task-real-innovation',
    title: 'Separate Novelty from Framing',
    question: 'Find what is actually new, and distinguish it from background framing or reused ideas.',
    narrativeHook: 'Read Related Work against Method. You need comparison evidence plus one concrete method detail.',
    section: 'related-work',
    whereToLook: ['Related Work', 'Method'],
    whatToFind: 'One prior-work comparison and one concrete method detail that show the claimed novelty.',
    submissionMode: 'evidence_plus_optional_judgment',
    recommendedEvidenceCount: 2,
    evaluationFocus: 'Whether the evidence separates real novelty from reused framing.',
    linkedStructureKinds: ['related-work', 'method'],
    requiredEvidenceTypes: ['comparison', 'method'],
    minEvidenceCount: 2,
    unlocksTaskIds: ['task-results-hold-up'],
  },
  {
    id: 'task-method-core-step',
    title: 'Isolate the Core Mechanism',
    question: 'What single step or design choice appears most central to the method?',
    narrativeHook: 'Do not summarize the whole method. Isolate the one mechanism the paper depends on.',
    section: 'method',
    whereToLook: ['Method', 'Implementation'],
    whatToFind: 'A concrete passage describing the core method step.',
    submissionMode: 'evidence_only',
    recommendedEvidenceCount: 1,
    evaluationFocus: 'Whether the evidence captures a core mechanism rather than a generic description.',
    linkedStructureKinds: ['method', 'implementation'],
    requiredEvidenceTypes: ['method'],
    minEvidenceCount: 1,
    unlocksTaskIds: [],
  },
  {
    id: 'task-results-hold-up',
    title: 'Interrogate the Evidence',
    question: 'Check whether the experiments and reported results actually support the paper\'s main claim.',
    narrativeHook: 'Go to Experiment and Result. Look for the strongest supporting result, not just any metric.',
    section: 'result',
    whereToLook: ['Experiment', 'Result'],
    whatToFind: 'The strongest result that directly supports the main claim.',
    submissionMode: 'evidence_plus_optional_judgment',
    recommendedEvidenceCount: 1,
    evaluationFocus: 'Whether the evidence truly supports the stated claim.',
    linkedStructureKinds: ['experiment', 'result'],
    requiredEvidenceTypes: ['result'],
    minEvidenceCount: 1,
    unlocksTaskIds: ['task-weak-point'],
  },
  {
    id: 'task-experiment-fairness',
    title: 'Check Experimental Fairness',
    question: 'Is there evidence that the experiment design makes the comparison fair or unfair?',
    narrativeHook: 'Look at datasets, baselines, and setup details. Fairness is often hidden there.',
    section: 'result',
    whereToLook: ['Experiment', 'Result'],
    whatToFind: 'Evidence about dataset choice, baselines, or evaluation setup that affects fairness.',
    submissionMode: 'evidence_plus_optional_judgment',
    recommendedEvidenceCount: 2,
    evaluationFocus: 'Whether the evidence is enough to judge fairness credibly.',
    linkedStructureKinds: ['experiment', 'result'],
    requiredEvidenceTypes: ['comparison', 'result'],
    minEvidenceCount: 2,
    unlocksTaskIds: [],
  },
  {
    id: 'task-results-weakness',
    title: 'Find the Weakest Result',
    question: 'Which result, ablation, or missing comparison most weakens confidence in the paper?',
    narrativeHook: 'Strong papers still have soft spots. Find the result that does not fully convince.',
    section: 'result',
    whereToLook: ['Result', 'Discussion'],
    whatToFind: 'A weak or missing result that leaves the claim vulnerable.',
    submissionMode: 'evidence_plus_optional_judgment',
    recommendedEvidenceCount: 1,
    evaluationFocus: 'Whether the evidence identifies a meaningful weakness rather than a minor issue.',
    linkedStructureKinds: ['result', 'discussion'],
    requiredEvidenceTypes: ['result'],
    minEvidenceCount: 1,
    unlocksTaskIds: [],
  },
  {
    id: 'task-weak-point',
    title: 'Expose the Weak Point',
    question: 'Find the limitation, uncertainty, or unresolved risk that keeps the paper from feeling fully closed.',
    narrativeHook: 'Every paper leaves a crack. Check Discussion or Limitation for the one that matters most.',
    section: 'discussion',
    whereToLook: ['Discussion', 'Limitation'],
    whatToFind: 'The most important unresolved risk or limitation.',
    submissionMode: 'evidence_plus_optional_judgment',
    recommendedEvidenceCount: 1,
    evaluationFocus: 'Whether the player found the limitation that most weakens confidence.',
    linkedStructureKinds: ['discussion', 'limitation'],
    requiredEvidenceTypes: ['limitation'],
    minEvidenceCount: 1,
    unlocksTaskIds: [],
  },
  {
    id: 'task-author-admission',
    title: 'Catch the Author Admission',
    question: 'What do the authors explicitly admit still does not work well or remains unresolved?',
    narrativeHook: 'Find the sentence where the paper gets most honest about its limits.',
    section: 'discussion',
    whereToLook: ['Discussion', 'Limitation', 'Conclusion'],
    whatToFind: 'A direct admission of weakness, limitation, or open problem.',
    submissionMode: 'evidence_only',
    recommendedEvidenceCount: 1,
    evaluationFocus: 'Whether the evidence captures a real limitation rather than a throwaway sentence.',
    linkedStructureKinds: ['discussion', 'limitation'],
    requiredEvidenceTypes: ['limitation'],
    minEvidenceCount: 1,
    unlocksTaskIds: [],
  },
];

export class CaseSetupService {
  private canUseIndexedDb(): boolean {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
  }

  async getCaseSetup(paperId: number): Promise<CaseSetup | null> {
    if (!this.canUseIndexedDb()) {
      return null;
    }

    return (await dbHelpers.getCaseSetup(paperId)) ?? null;
  }

  async generateCaseSetup(options: GenerateCaseSetupOptions): Promise<CaseSetup> {
    const { paperId, pdfText, forceRegenerate = false, apiKey, model } = options;
    const canPersist = this.canUseIndexedDb();

    if (canPersist && !forceRegenerate) {
      const cached = await dbHelpers.getCaseSetup(paperId);
      if (cached) {
        return cached;
      }
    }

    const localStructureNodes = this.buildFallbackStructureNodes(pdfText);
    let rawFrame: RawCaseSetup;
    try {
      rawFrame = await this.generateFrameWithRecovery(pdfText, localStructureNodes, apiKey, model);
    } catch (error: unknown) {
      throw this.withStage(error, 'frame');
    }
    const normalizedStructureNodes = this.normalizeStructureNodes(
      rawFrame.structureNodes ?? [],
      localStructureNodes
    );
    let completedTasks: Array<Partial<InvestigationTask>>;
    try {
      const combinedTasks = await this.generateTaskBatches(
        pdfText,
        rawFrame,
        normalizedStructureNodes,
        apiKey,
        model
      );
      completedTasks = await this.ensureMinimumTasks(
        pdfText,
        rawFrame,
        normalizedStructureNodes,
        combinedTasks,
        apiKey,
        model
      );
    } catch (error: unknown) {
      throw this.withStage(error, 'tasks');
    }

    const caseSetup = this.normalizeCaseSetup(
      paperId,
      rawFrame,
      { tasks: completedTasks },
      normalizedStructureNodes
    );

    if (canPersist) {
      await dbHelpers.saveCaseSetup(caseSetup);
    }

    return caseSetup;
  }

  private buildFramePrompt(
    pdfText: string,
    localStructureNodes: PaperStructureNode[],
    compressionMode: 'full' | 'compact' = 'full'
  ): string {
    const paperDigest = this.buildPaperDigest(pdfText, compressionMode);

    return [
      'You are building a suspense-light paper investigation setup.',
      'Read the paper and return valid structured JSON only.',
      `Compression mode: ${compressionMode}`,
      'Return only the case framing and section map for this paper.',
      'Do not invent facts absent from the paper.',
      'Identify uncertainty explicitly.',
      'Do not provide a final conclusion.',
      'Return a single JSON object only. Do not use markdown fences. Do not add commentary before or after the JSON.',
      'Use strict JSON with double-quoted keys and string values.',
      'Return structured JSON only with keys:',
      'caseTitle, caseBackground, coreDispute, openingJudgment, investigationGoal, structureNodes.',
      'Each structure node should include id, kind, title, summary, pageHints, importance.',
      'If structureNodes are uncertain, you may refine the detected section candidates below instead of inventing new sections.',
      `Detected section candidates: ${JSON.stringify(
        localStructureNodes.map((node) => ({
          kind: node.kind,
          title: node.title,
          summary: node.summary,
        }))
      )}`,
      'Paper digest:',
      paperDigest,
    ].join('\n\n');
  }

  private buildSectionTasksPrompt(
    pdfText: string,
    rawFrame: RawCaseSetup,
    structureNodes: PaperStructureNode[],
    sections: QuestionSection[],
    existingTasks: Array<Partial<InvestigationTask>>,
    compressionMode: 'full' | 'compact' = 'full'
  ): string {
    const paperDigest = this.buildPaperDigest(pdfText, compressionMode, sections);

    return [
      'You are generating investigation tasks for a paper detective game.',
      'Return valid structured JSON only.',
      `Compression mode: ${compressionMode}`,
      'Generate investigation tasks for these sections of the paper.',
      'Every task must mention paper-specific content such as the named method, datasets, baselines, result patterns, or stated limitations from the paper.',
      'Questions must be concrete enough that a player knows what to look for in the text.',
      'Do not invent facts absent from the paper.',
      'Return a single JSON object only. Do not use markdown fences. Do not add commentary before or after the JSON.',
      'Use strict JSON with double-quoted keys and string values.',
      'Return structured JSON only with the key: tasks.',
      'Each task should include id, title, question, narrativeHook, section, whereToLook, whatToFind, submissionMode, recommendedEvidenceCount, evaluationFocus, linkedStructureKinds, requiredEvidenceTypes, minEvidenceCount, unlocksTaskIds.',
      'Use submissionMode values: evidence_only or evidence_plus_optional_judgment.',
      `Focus sections: ${JSON.stringify(sections)}`,
      `Already generated tasks: ${JSON.stringify(existingTasks.map((task) => ({
        title: task.title,
        section: task.section,
        whatToFind: task.whatToFind,
      })))}`,
      `Case framing: ${JSON.stringify({
        caseTitle: rawFrame.caseTitle,
        caseBackground: rawFrame.caseBackground,
        coreDispute: rawFrame.coreDispute,
        openingJudgment: rawFrame.openingJudgment,
        investigationGoal: rawFrame.investigationGoal,
      })}`,
      `Paper structure: ${JSON.stringify(
        structureNodes.map((node) => ({
          kind: node.kind,
          title: node.title,
          summary: node.summary,
        }))
      )}`,
      'Paper digest:',
      paperDigest,
    ].join('\n\n');
  }

  private async generateTaskBatches(
    pdfText: string,
    rawFrame: RawCaseSetup,
    structureNodes: PaperStructureNode[],
    apiKey?: string,
    model?: string
  ): Promise<Array<Partial<InvestigationTask>>> {
    const aggregatedTasks: Array<Partial<InvestigationTask>> = [];

    for (const sections of TASK_BATCHES) {
      const prompt = this.buildSectionTasksPrompt(
        pdfText,
        rawFrame,
        structureNodes,
        sections,
        aggregatedTasks
      );
      try {
        const batch = await this.generateTaskBatchWithRecovery({
          prompt,
          maxTokens: 1200,
          apiKey,
          model,
        });
        if (batch && Array.isArray(batch.tasks)) {
          aggregatedTasks.push(...batch.tasks);
        }
      } catch (error: unknown) {
        const candidate = error as Error & { code?: string };

        if (candidate.code !== 'PARSE_ERROR' || sections.length <= 1) {
          throw error;
        }

        for (const section of sections) {
          const sectionPrompt = this.buildSectionTasksPrompt(
            pdfText,
            rawFrame,
            structureNodes,
            [section],
            aggregatedTasks
          );
          const sectionBatch = await this.generateTaskBatchWithRecovery({
            prompt: sectionPrompt,
            maxTokens: 900,
            apiKey,
            model,
          });
          if (sectionBatch && Array.isArray(sectionBatch.tasks)) {
            aggregatedTasks.push(...sectionBatch.tasks);
          }
        }
      }
    }

    return aggregatedTasks;
  }

  private async ensureMinimumTasks(
    pdfText: string,
    rawFrame: RawCaseSetup,
    structureNodes: PaperStructureNode[],
    tasks: Array<Partial<InvestigationTask>>,
    apiKey?: string,
    model?: string
  ): Promise<Array<Partial<InvestigationTask>>> {
    if (tasks.length >= MIN_TASK_COUNT) {
      return tasks;
    }

    const missingCount = MIN_TASK_COUNT - tasks.length;
    const prompt = [
      'The current investigation task set is too small.',
      `Generate exactly ${missingCount} additional investigation tasks for this paper.`,
      'Return plain text only.',
      'Use one line per task with this exact format:',
      'TASK: title || question || section || whereToLook || whatToFind || submissionMode || requiredEvidenceTypes || minEvidenceCount || evaluationFocus',
      'Use section values: intro, related-work, method, result, discussion, other.',
      'Use submissionMode values: evidence_only or evidence_plus_optional_judgment.',
      'Use requiredEvidenceTypes values separated by | from: claim, comparison, method, result, limitation.',
      `Already generated tasks: ${JSON.stringify(tasks.map((task) => ({
        title: task.title,
        section: task.section,
        whatToFind: task.whatToFind,
      })))}`,
      `Case framing: ${JSON.stringify({
        caseTitle: rawFrame.caseTitle,
        coreDispute: rawFrame.coreDispute,
        investigationGoal: rawFrame.investigationGoal,
      })}`,
      `Paper structure: ${JSON.stringify(
        structureNodes.map((node) => ({
          kind: node.kind,
          title: node.title,
          summary: node.summary,
        }))
      )}`,
      'Paper digest:',
      this.buildPaperDigest(pdfText, 'compact'),
    ].join('\n\n');

    const response = await aiService.generateText({
      prompt,
      maxTokens: 900,
      stream: false,
      apiKey,
      model,
    });

    if (typeof response !== 'string') {
      return tasks;
    }

    const supplementalTasks = this.parseDelimitedTaskLines(response);
    return [...tasks, ...supplementalTasks];
  }

  private async generateFrameWithRecovery(
    pdfText: string,
    localStructureNodes: PaperStructureNode[],
    apiKey?: string,
    model?: string
  ): Promise<RawCaseSetup> {
    const promptVariants: Array<{ prompt: string; maxTokens: number }> = [
      { prompt: this.buildFramePrompt(pdfText, localStructureNodes, 'full'), maxTokens: 1600 },
      { prompt: this.buildFramePrompt(pdfText, localStructureNodes, 'compact'), maxTokens: 1200 },
    ];

    for (const variant of promptVariants) {
      try {
        return await aiService.generateStructuredData<RawCaseSetup>({
          prompt: variant.prompt,
          maxTokens: variant.maxTokens,
          apiKey,
          model,
        });
      } catch (error: unknown) {
        const candidate = error as Error & { code?: string };
        if (candidate.code && candidate.code !== 'PARSE_ERROR' && candidate.code !== 'NETWORK_ERROR') {
          throw error;
        }
      }
    }

    for (const variant of promptVariants) {
      try {
        const rawText = await aiService.generateText({
          prompt: `${variant.prompt}\n\nIf strict JSON fails, still return one JSON-like object with these keys: caseTitle, caseBackground, coreDispute, openingJudgment, investigationGoal, structureNodes.`,
          maxTokens: variant.maxTokens,
          stream: false,
          apiKey,
          model,
        });
        const recovered = this.extractFirstLooseObject<RawCaseSetup>(rawText);
        if (recovered) {
          return recovered;
        }
      } catch {
        // Continue to tagged fallback.
      }

      try {
        const taggedText = await aiService.generateText({
          prompt: [
            variant.prompt,
            'If JSON fails, return plain text only using this exact protocol:',
            'CASE_TITLE: ...',
            'CASE_BACKGROUND: ...',
            'CORE_DISPUTE: ...',
            'OPENING_JUDGMENT: ...',
            'INVESTIGATION_GOAL: ...',
            'STRUCTURE_NODE: kind | title | summary | importance',
            'Repeat STRUCTURE_NODE for each section.',
          ].join('\n\n'),
          maxTokens: variant.maxTokens,
          stream: false,
          apiKey,
          model,
        });
        const taggedFrame = this.parseTaggedFrame(taggedText);
        if (taggedFrame) {
          return taggedFrame;
        }
      } catch {
        // Continue to heuristic fallback.
      }
    }

    return this.buildFallbackFrame(pdfText, localStructureNodes);
  }

  private buildPaperDigest(
    pdfText: string,
    compressionMode: 'full' | 'compact',
    sections: QuestionSection[] = []
  ): string {
    const maxChars = compressionMode === 'compact' ? 6000 : 14000;
    const normalized = pdfText.replace(/\r/g, '');
    const lines = normalized
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const title = this.extractPaperTitle(pdfText) ?? 'Unknown title';
    const abstractBlock = this.extractSectionSnippet(normalized, ['abstract'], 1200);
    const introBlock = this.extractSectionSnippet(normalized, ['introduction', 'intro'], 1800);
    const relatedBlock = this.extractSectionSnippet(normalized, ['related work', 'background'], 1400);
    const methodBlock = this.extractSectionSnippet(normalized, ['method', 'approach', 'model', 'implementation'], 1800);
    const resultBlock = this.extractSectionSnippet(normalized, ['experiment', 'evaluation', 'results', 'analysis'], 1800);
    const discussionBlock = this.extractSectionSnippet(normalized, ['discussion', 'limitation', 'conclusion'], 1200);

    const selectedBlocks: string[] = [
      `Title: ${title}`,
      `Opening lines: ${lines.slice(0, 8).join(' ')}`.trim(),
    ];

    if (abstractBlock) selectedBlocks.push(`Abstract: ${abstractBlock}`);
    if (sections.length === 0 || sections.includes('intro')) selectedBlocks.push(`Introduction: ${introBlock}`);
    if (sections.length === 0 || sections.includes('related-work')) selectedBlocks.push(`Related work: ${relatedBlock}`);
    if (sections.length === 0 || sections.includes('method')) selectedBlocks.push(`Method: ${methodBlock}`);
    if (sections.length === 0 || sections.includes('result')) selectedBlocks.push(`Results: ${resultBlock}`);
    if (sections.length === 0 || sections.includes('discussion')) selectedBlocks.push(`Discussion: ${discussionBlock}`);

    return selectedBlocks
      .filter((block) => typeof block === 'string' && block.trim().length > 0)
      .join('\n\n')
      .slice(0, maxChars);
  }

  private extractSectionSnippet(pdfText: string, sectionNames: string[], limit: number): string {
    for (const sectionName of sectionNames) {
      const pattern = new RegExp(`(^|\\n)\\s*(\\d+\\.?\\s*)?${sectionName}\\b`, 'i');
      const match = pattern.exec(pdfText);
      if (!match) {
        continue;
      }

      const start = match.index;
      const nextHeadingMatch = /\n\s*(\d+\.?\s*)?[A-Z][A-Za-z\s-]{2,}\n/g;
      nextHeadingMatch.lastIndex = start + match[0].length;
      const next = nextHeadingMatch.exec(pdfText);
      const end = next ? next.index : Math.min(pdfText.length, start + limit * 2);
      return pdfText.slice(start, end).replace(/\s+/g, ' ').trim().slice(0, limit);
    }

    return '';
  }

  private async generateTaskBatchWithRecovery(options: {
    prompt: string;
    maxTokens: number;
    apiKey?: string;
    model?: string;
  }): Promise<RawTaskSet> {
    const { prompt, maxTokens, apiKey, model } = options;

    try {
      return await aiService.generateStructuredData<RawTaskSet>({
        prompt,
        maxTokens,
        apiKey,
        model,
      });
    } catch (error: unknown) {
      const candidate = error as Error & { code?: string };
      if (candidate.code !== 'PARSE_ERROR') {
        throw error;
      }

      const rawText = await aiService.generateText({
        prompt: `${prompt}\n\nIf strict JSON fails, return JSON-like task objects only. Each object must include: title, question, section, whatToFind, whereToLook, submissionMode, evaluationFocus, requiredEvidenceTypes, minEvidenceCount.`,
        maxTokens,
        stream: false,
        apiKey,
        model,
      });
      if (typeof rawText !== 'string') {
        throw error;
      }
      const recoveredTasks = this.extractLooseTasks(rawText);
      if (recoveredTasks.length > 0) {
        return { tasks: recoveredTasks };
      }

      const taggedText = await aiService.generateText({
        prompt: [
          prompt,
          'If JSON fails, return tasks in plain text using this exact protocol:',
          'TASK',
          'title: ...',
          'question: ...',
          'narrativeHook: ...',
          'section: intro|related-work|method|result|discussion|other',
          'whereToLook: item1 | item2',
          'whatToFind: ...',
          'submissionMode: evidence_only or evidence_plus_optional_judgment',
          'recommendedEvidenceCount: number',
          'evaluationFocus: ...',
          'linkedStructureKinds: item1 | item2',
          'requiredEvidenceTypes: item1 | item2',
          'minEvidenceCount: number',
          'Return only task blocks.',
        ].join('\n\n'),
        maxTokens,
        stream: false,
        apiKey,
        model,
      });
      if (typeof taggedText !== 'string') {
        throw error;
      }

      const taggedTasks = this.parseTaggedTaskBlocks(taggedText);
      if (taggedTasks.length > 0) {
        return { tasks: taggedTasks };
      }

      throw error;
    }
  }

  private extractLooseTasks(rawText: string): Array<Partial<InvestigationTask>> {
    const objects = this.extractLooseObjects(rawText);
    const tasks: Array<Partial<InvestigationTask>> = [];

    for (const object of objects) {
      const parsed = this.parseLooseJsonObject<Record<string, unknown>>(object);
      if (!parsed) {
        continue;
      }

      if (Array.isArray(parsed.tasks)) {
        for (const task of parsed.tasks) {
          if (task && typeof task === 'object') {
            tasks.push(task as Partial<InvestigationTask>);
          }
        }
        continue;
      }

      if (typeof parsed.title === 'string' && typeof parsed.question === 'string') {
        tasks.push(parsed as Partial<InvestigationTask>);
      }
    }

    return tasks;
  }

  private extractFirstLooseObject<T>(rawText: string): T | null {
    const objects = this.extractLooseObjects(rawText);
    for (const object of objects) {
      const parsed = this.parseLooseJsonObject<T>(object);
      if (parsed) {
        return parsed;
      }
    }

    return null;
  }

  private parseTaggedTaskBlocks(rawText: string): Array<Partial<InvestigationTask>> {
    const blocks = rawText
      .split(/\n\s*\n/g)
      .map((block) => block.trim())
      .filter((block) => block.startsWith('TASK'));

    return blocks
      .map((block) => {
        const fields = new Map<string, string>();
        for (const line of block.split(/\r?\n/)) {
          const separator = line.indexOf(':');
          if (separator <= 0) {
            continue;
          }
          const key = line.slice(0, separator).trim().toLowerCase();
          const value = line.slice(separator + 1).trim();
          if (value.length > 0) {
            fields.set(key, value);
          }
        }

        const title = fields.get('title');
        const question = fields.get('question');
        const whatToFind = fields.get('whattofind');
        if (!title || !question || !whatToFind) {
          return null;
        }

        return {
          title,
          question,
          narrativeHook: fields.get('narrativehook'),
          section: fields.get('section'),
          whereToLook: fields.get('wheretolook')?.split('|').map((value) => value.trim()).filter(Boolean),
          whatToFind,
          submissionMode: fields.get('submissionmode'),
          recommendedEvidenceCount: fields.get('recommendedevidencecount')
            ? Number.parseInt(fields.get('recommendedevidencecount')!, 10)
            : undefined,
          evaluationFocus: fields.get('evaluationfocus'),
          linkedStructureKinds: fields.get('linkedstructurekinds')?.split('|').map((value) => value.trim()).filter(Boolean),
          requiredEvidenceTypes: fields.get('requiredevidencetypes')?.split('|').map((value) => value.trim()).filter(Boolean),
          minEvidenceCount: fields.get('minevidencecount')
            ? Number.parseInt(fields.get('minevidencecount')!, 10)
            : undefined,
        } as Partial<InvestigationTask>;
      })
      .filter((task): task is Partial<InvestigationTask> => task !== null);
  }

  private parseDelimitedTaskLines(rawText: string): Array<Partial<InvestigationTask>> {
    return rawText
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter((line) => line.startsWith('TASK:'))
      .map((line) => {
        const parts = line.replace(/^TASK:\s*/, '').split('||').map((part) => part.trim());
        if (parts.length < 9) {
          return null;
        }

        const [
          title,
          question,
          section,
          whereToLook,
          whatToFind,
          submissionMode,
          requiredEvidenceTypes,
          minEvidenceCount,
          evaluationFocus,
        ] = parts;

        return {
          title,
          question,
          section,
          whereToLook: whereToLook.split('|').map((value) => value.trim()).filter(Boolean),
          whatToFind,
          submissionMode,
          requiredEvidenceTypes: requiredEvidenceTypes.split('|').map((value) => value.trim()).filter(Boolean),
          minEvidenceCount: Number.parseInt(minEvidenceCount, 10),
          evaluationFocus,
          recommendedEvidenceCount: Math.max(1, Number.parseInt(minEvidenceCount, 10) || 1),
        } as Partial<InvestigationTask>;
      })
      .filter((task): task is Partial<InvestigationTask> => task !== null);
  }

  private parseTaggedFrame(rawText: string): RawCaseSetup | null {
    const lines = rawText
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter(Boolean);
    const result: RawCaseSetup = {};
    const structureNodes: Array<Partial<PaperStructureNode>> = [];

    for (const line of lines) {
      if (line.startsWith('CASE_TITLE:')) {
        result.caseTitle = line.replace('CASE_TITLE:', '').trim();
      } else if (line.startsWith('CASE_BACKGROUND:')) {
        result.caseBackground = line.replace('CASE_BACKGROUND:', '').trim();
      } else if (line.startsWith('CORE_DISPUTE:')) {
        result.coreDispute = line.replace('CORE_DISPUTE:', '').trim();
      } else if (line.startsWith('OPENING_JUDGMENT:')) {
        result.openingJudgment = line.replace('OPENING_JUDGMENT:', '').trim();
      } else if (line.startsWith('INVESTIGATION_GOAL:')) {
        result.investigationGoal = line.replace('INVESTIGATION_GOAL:', '').trim();
      } else if (line.startsWith('STRUCTURE_NODE:')) {
        const parts = line.replace('STRUCTURE_NODE:', '').split('|').map((part) => part.trim());
        if (parts.length >= 4) {
          structureNodes.push({
            kind: parts[0] as PaperStructureKind,
            title: parts[1],
            summary: parts[2],
            importance: parts[3] as PaperStructureNode['importance'],
          });
        }
      }
    }

    if (!result.caseTitle || !result.caseBackground || !result.coreDispute) {
      return null;
    }

    result.structureNodes = structureNodes;
    return result;
  }

  private buildFallbackFrame(
    pdfText: string,
    localStructureNodes: PaperStructureNode[]
  ): RawCaseSetup {
    const title = this.extractPaperTitle(pdfText) ?? 'Paper Investigation';
    const openingLines = pdfText
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 6)
      .join(' ');

    return {
      caseTitle: `${title}: Investigation Setup`,
      caseBackground: `This paper has been loaded. Start by validating its main framing against the extracted structure. ${openingLines}`.trim(),
      coreDispute: 'The paper presents a claim that should be checked against its method, evidence, and stated limits.',
      openingJudgment: 'The investigation can proceed, but the initial frame was reconstructed from extracted paper structure rather than a fully structured AI response.',
      investigationGoal: 'Collect paper-grounded evidence for the claim, novelty, experimental support, and the main unresolved weakness.',
      structureNodes: localStructureNodes,
    };
  }

  private withStage(error: unknown, stage: 'frame' | 'tasks'): Error {
    const candidate = error as Error & { code?: string; stage?: string };
    const wrapped = new Error(
      stage === 'frame'
        ? `Case frame generation failed: ${candidate.message || 'Unknown error'}`
        : `Investigation task generation failed: ${candidate.message || 'Unknown error'}`
    ) as Error & { code?: string; stage?: string };
    wrapped.code = candidate.code;
    wrapped.stage = stage;
    return wrapped;
  }

  private extractLooseObjects(rawText: string): string[] {
    const results: string[] = [];
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = 0; index < rawText.length; index += 1) {
      const char = rawText[index];

      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) {
        continue;
      }
      if (char === '{') {
        if (depth === 0) {
          start = index;
        }
        depth += 1;
        continue;
      }
      if (char === '}' && depth > 0) {
        depth -= 1;
        if (depth === 0 && start >= 0) {
          results.push(rawText.slice(start, index + 1));
          start = -1;
        }
      }
    }

    return results;
  }

  private parseLooseJsonObject<T>(rawObject: string): T | null {
    const normalized = rawObject
      .trim()
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_-]*)(\s*:)/g, '$1"$2"$3')
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, value: string) => `"${value.replace(/"/g, '\\"')}"`)
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      .replace(/,\s*([}\]])/g, '$1');

    try {
      return JSON.parse(normalized) as T;
    } catch {
      return null;
    }
  }

  private normalizeCaseSetup(
    paperId: number,
    rawFrame: RawCaseSetup,
    rawTasks: RawTaskSet,
    structureNodes: PaperStructureNode[]
  ): CaseSetup {
    const tasks = this.normalizeTasks(rawTasks.tasks ?? []);
    const questionNodes = this.buildQuestionNodes(paperId, tasks);
    const questionRelations = this.buildQuestionRelations(paperId, tasks);
    const doctorState = this.buildInitialDoctorState(paperId, questionNodes);

    return {
      paperId,
      caseTitle: rawFrame.caseTitle?.trim() || 'Untitled Investigation',
      caseBackground: rawFrame.caseBackground?.trim() || 'A paper has made a claim that needs verification.',
      coreDispute: rawFrame.coreDispute?.trim() || 'The paper\'s core claim is still under review.',
      openingJudgment: rawFrame.openingJudgment?.trim() || 'The opening evidence is suggestive, not conclusive.',
      investigationGoal: rawFrame.investigationGoal?.trim() || 'Verify the paper using direct text evidence.',
      structureNodes,
      tasks,
      questionNodes,
      questionRelations,
      doctorState,
      generatedAt: new Date().toISOString(),
      model: DEFAULT_AI_MODEL,
      source: 'ai-generated',
    };
  }

  private buildFallbackCaseSetup(paperId: number, pdfText: string): CaseSetup {
    const titleSeed = this.extractPaperTitle(pdfText);
    const tasks = this.normalizeTasks([]);
    const questionNodes = this.buildQuestionNodes(paperId, tasks);
    const questionRelations = this.buildQuestionRelations(paperId, tasks);
    const doctorState = this.buildInitialDoctorState(paperId, questionNodes);

    return {
      paperId,
      caseTitle: titleSeed ? `${titleSeed}: The Open Question` : 'Fallback Investigation',
      caseBackground: 'The paper text was extracted successfully, but the AI case file could not be fully structured from that text. Start from the paper structure and verify the core claim manually.',
      coreDispute: 'The paper makes a claim that still needs to be checked against its method, evidence, and limitations.',
      openingJudgment: 'The investigation can begin, but the initial case framing was generated from fallback text-based heuristics.',
      investigationGoal: 'Collect direct text evidence for the core claim, the claimed novelty, the experimental support, and the remaining weak point.',
      structureNodes: this.buildFallbackStructureNodes(pdfText),
      tasks,
      questionNodes,
      questionRelations,
      doctorState,
      generatedAt: new Date().toISOString(),
      model: DEFAULT_AI_MODEL,
      source: 'ai-generated',
    };
  }

  private buildFallbackStructureNodes(pdfText: string): PaperStructureNode[] {
    const sectionSpecs: Array<{
      kind: PaperStructureKind;
      patterns: RegExp[];
      title: string;
      summary: string;
      importance: PaperStructureNode['importance'];
    }> = [
      {
        kind: 'intro',
        patterns: [/^\s*(\d+\.?\s*)?(introduction|intro)\b/im],
        title: 'Introduction',
        summary: 'Locate the opening problem statement and the main claim.',
        importance: 'critical',
      },
      {
        kind: 'related-work',
        patterns: [/^\s*(\d+\.?\s*)?(related work|background)\b/im],
        title: 'Related Work',
        summary: 'Check which prior approaches the paper compares itself against.',
        importance: 'important',
      },
      {
        kind: 'method',
        patterns: [/^\s*(\d+\.?\s*)?(method|approach|model)\b/im],
        title: 'Method',
        summary: 'Find the mechanism the authors claim is novel.',
        importance: 'critical',
      },
      {
        kind: 'experiment',
        patterns: [/^\s*(\d+\.?\s*)?(experiment|evaluation|experimental setup)\b/im],
        title: 'Experiment',
        summary: 'Trace how the paper tests its claim.',
        importance: 'important',
      },
      {
        kind: 'result',
        patterns: [/^\s*(\d+\.?\s*)?(results?|analysis)\b/im],
        title: 'Results',
        summary: 'Inspect whether the reported evidence supports the claim.',
        importance: 'critical',
      },
      {
        kind: 'discussion',
        patterns: [/^\s*(\d+\.?\s*)?(discussion|conclusion)\b/im],
        title: 'Discussion',
        summary: 'Look for the authors\' interpretation of the results.',
        importance: 'supporting',
      },
      {
        kind: 'limitation',
        patterns: [/^\s*(\d+\.?\s*)?(limitations?|future work)\b/im],
        title: 'Limitations',
        summary: 'Identify what remains unresolved or weak.',
        importance: 'important',
      },
    ];

    const detectedNodes = sectionSpecs
      .filter((spec) => spec.patterns.some((pattern) => pattern.test(pdfText)))
      .map((spec, index) => ({
        id: `fallback-${spec.kind}-${index + 1}`,
        kind: spec.kind,
        title: spec.title,
        summary: spec.summary,
        pageHints: [],
        importance: spec.importance,
        status: 'unseen' as const,
      }));

    if (detectedNodes.length > 0) {
      return detectedNodes;
    }

    return [
      {
        id: 'fallback-intro-1',
        kind: 'intro',
        title: 'Opening Claim',
        summary: 'Start from the paper opening and identify the problem statement.',
        pageHints: [],
        importance: 'critical',
        status: 'unseen',
      },
      {
        id: 'fallback-method-2',
        kind: 'method',
        title: 'Method',
        summary: 'Find the proposed method and isolate the claimed novelty.',
        pageHints: [],
        importance: 'critical',
        status: 'unseen',
      },
      {
        id: 'fallback-result-3',
        kind: 'result',
        title: 'Results',
        summary: 'Find the experiments and test whether the evidence holds up.',
        pageHints: [],
        importance: 'important',
        status: 'unseen',
      },
    ];
  }

  private extractPaperTitle(pdfText: string): string | null {
    const lines = pdfText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const title = lines.find((line) => line.length > 12 && line.length < 180);
    return title ?? null;
  }

  private normalizeStructureNodes(
    nodes: Array<Partial<PaperStructureNode>>,
    fallbackNodes: PaperStructureNode[]
  ): PaperStructureNode[] {
    if (nodes.length === 0) {
      return fallbackNodes;
    }

    return nodes.map((node, index) => ({
      id: node.id?.trim() || `structure-${index + 1}`,
      kind: this.normalizeStructureKind(node.kind),
      title: node.title?.trim() || `Section ${index + 1}`,
      summary: node.summary?.trim() || 'No summary provided.',
      pageHints: Array.isArray(node.pageHints) ? node.pageHints.filter((hint): hint is number => Number.isInteger(hint)) : [],
      importance: node.importance === 'critical' || node.importance === 'important' || node.importance === 'supporting'
        ? node.importance
        : 'supporting',
      status: 'unseen',
    }));
  }

  private normalizeTasks(tasks: Array<Partial<InvestigationTask>>): InvestigationTask[] {
    if (tasks.length < MIN_TASK_COUNT) {
      throw Object.assign(new Error('AI case setup did not include enough investigation tasks'), {
        code: 'PARSE_ERROR',
      });
    }

    return tasks.slice(0, MAX_TASK_COUNT).map((task, index) => {
      const fallback = DEFAULT_TASKS[index] ?? DEFAULT_TASKS[DEFAULT_TASKS.length - 1];

      return {
        id: task.id?.trim() || fallback.id,
        title: task.title?.trim() || fallback.title,
        question: task.question?.trim() || fallback.question,
        narrativeHook: task.narrativeHook?.trim() || fallback.narrativeHook,
        section: this.normalizeQuestionSection(task.section, fallback.section),
        whereToLook: this.normalizeStringList(task.whereToLook, fallback.whereToLook),
        whatToFind: task.whatToFind?.trim() || fallback.whatToFind,
        submissionMode: task.submissionMode === 'evidence_only' || task.submissionMode === 'evidence_plus_optional_judgment'
          ? task.submissionMode
          : fallback.submissionMode,
        recommendedEvidenceCount: typeof task.recommendedEvidenceCount === 'number' && task.recommendedEvidenceCount > 0
          ? task.recommendedEvidenceCount
          : fallback.recommendedEvidenceCount,
        evaluationFocus: task.evaluationFocus?.trim() || fallback.evaluationFocus,
        score: typeof task.score === 'number' ? task.score : undefined,
        feedback: task.feedback?.trim() || undefined,
        submittedAt: task.submittedAt?.trim() || undefined,
        linkedStructureKinds: this.normalizeStructureKinds(task.linkedStructureKinds, fallback.linkedStructureKinds),
        requiredEvidenceTypes: this.normalizeEvidenceTypes(task.requiredEvidenceTypes, fallback.requiredEvidenceTypes),
        minEvidenceCount: typeof task.minEvidenceCount === 'number' && task.minEvidenceCount > 0
          ? task.minEvidenceCount
          : fallback.minEvidenceCount,
        unlocksTaskIds: Array.isArray(task.unlocksTaskIds)
          ? task.unlocksTaskIds.filter((taskId): taskId is string => typeof taskId === 'string' && taskId.length > 0)
          : fallback.unlocksTaskIds,
        status: index === 0
          ? 'available'
          : this.normalizeTaskStatus((task as Partial<InvestigationTask>).status),
      };
    });
  }

  private normalizeQuestionSection(section: unknown, fallback: QuestionSection): QuestionSection {
    const allowedSections: QuestionSection[] = ['intro', 'related-work', 'method', 'result', 'discussion', 'other'];
    return typeof section === 'string' && allowedSections.includes(section as QuestionSection)
      ? (section as QuestionSection)
      : fallback;
  }

  private normalizeStructureKind(kind: unknown): PaperStructureKind {
    const allowedKinds: PaperStructureKind[] = [
      'intro',
      'related-work',
      'method',
      'implementation',
      'experiment',
      'result',
      'discussion',
      'limitation',
      'other',
    ];

    return typeof kind === 'string' && allowedKinds.includes(kind as PaperStructureKind)
      ? (kind as PaperStructureKind)
      : 'other';
  }

  private normalizeStructureKinds(
    kinds: InvestigationTask['linkedStructureKinds'] | undefined,
    fallback: InvestigationTask['linkedStructureKinds']
  ): PaperStructureKind[] {
    if (!Array.isArray(kinds) || kinds.length === 0) {
      return fallback;
    }

    const normalized = kinds.map((kind) => this.normalizeStructureKind(kind));
    return normalized.length > 0 ? normalized : fallback;
  }

  private normalizeEvidenceTypes(
    evidenceTypes: InvestigationTask['requiredEvidenceTypes'] | undefined,
    fallback: InvestigationTask['requiredEvidenceTypes']
  ): EvidenceType[] {
    const allowedTypes: EvidenceType[] = ['claim', 'comparison', 'method', 'result', 'limitation'];

    if (!Array.isArray(evidenceTypes) || evidenceTypes.length === 0) {
      return fallback;
    }

    const normalized = evidenceTypes.filter(
      (evidenceType): evidenceType is EvidenceType =>
        typeof evidenceType === 'string' && allowedTypes.includes(evidenceType as EvidenceType)
    );

    return normalized.length > 0 ? normalized : fallback;
  }

  private normalizeStringList(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value) || value.length === 0) {
      return fallback;
    }

    const normalized = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return normalized.length > 0 ? normalized : fallback;
  }

  private normalizeTaskStatus(status: unknown): InvestigationTask['status'] {
    return status === 'available' || status === 'in_progress' || status === 'completed'
      ? status
      : 'locked';
  }

  private buildQuestionNodes(paperId: number, tasks: InvestigationTask[]): QuestionNode[] {
    return tasks.map((task, index) => ({
      id: `question-${task.id}`,
      paperId,
      title: task.title,
      prompt: task.question,
      type: this.mapTaskToQuestionType(task),
      status: 'open',
      parentQuestionId: null,
      dependsOnQuestionIds: [],
      assignedEvidenceIds: [],
      position: {
        x: 120 + (index % 3) * 260,
        y: 120 + Math.floor(index / 3) * 180,
      },
      score: task.score,
      feedback: task.feedback,
    }));
  }

  private buildQuestionRelations(paperId: number, tasks: InvestigationTask[]): QuestionRelation[] {
    return tasks.flatMap((task) =>
      task.unlocksTaskIds.map((unlockedTaskId) => ({
        id: `question-relation-${task.id}-${unlockedTaskId}`,
        paperId,
        sourceQuestionId: `question-${task.id}`,
        targetQuestionId: `question-${unlockedTaskId}`,
        relationType: this.mapTaskToRelationType(task),
        note: undefined,
        createdAt: new Date().toISOString(),
      }))
    );
  }

  private buildInitialDoctorState(paperId: number, questionNodes: QuestionNode[]): DoctorState {
    return {
      paperId,
      activeQuestionId: questionNodes[0]?.id ?? null,
      mode: 'skeptical',
      message: 'The diagnosis is still provisional. Lock the core claim before testing support and limitations.',
      updatedAt: new Date().toISOString(),
    };
  }

  private mapTaskToQuestionType(task: InvestigationTask): QuestionNode['type'] {
    if (task.requiredEvidenceTypes.includes('limitation') || task.section === 'discussion') {
      return 'limitation';
    }

    if (task.requiredEvidenceTypes.includes('method') || task.section === 'method') {
      return 'method';
    }

    if (task.requiredEvidenceTypes.includes('claim') || task.section === 'intro') {
      return 'claim';
    }

    return 'evidence';
  }

  private mapTaskToRelationType(task: InvestigationTask): QuestionRelationType {
    if (task.requiredEvidenceTypes.includes('limitation') || task.section === 'discussion') {
      return 'limitation-of';
    }

    if (task.requiredEvidenceTypes.includes('method') || task.section === 'method') {
      return 'method-for';
    }

    return 'support';
  }
}

export const caseSetupService = new CaseSetupService();
