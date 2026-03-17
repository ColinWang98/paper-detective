import { dbHelpers } from '@/lib/db';
import type { CaseSetup, EvidenceType, InvestigationTask, PaperStructureKind, PaperStructureNode } from '@/types';

import { aiService } from './aiService';
import { DEFAULT_AI_MODEL } from './aiProvider';

interface GenerateCaseSetupOptions {
  paperId: number;
  pdfText: string;
  forceRegenerate?: boolean;
}

interface RawCaseSetup {
  caseTitle?: string;
  caseBackground?: string;
  coreDispute?: string;
  openingJudgment?: string;
  investigationGoal?: string;
  structureNodes?: Array<Partial<PaperStructureNode>>;
  tasks?: Array<Partial<InvestigationTask>>;
}

const DEFAULT_TASKS: Array<Omit<InvestigationTask, 'status'>> = [
  {
    id: 'task-define-case',
    title: 'Define the Case',
    question: 'What problem does the paper claim to solve?',
    narrativeHook: 'Start with the paper opening claim.',
    linkedStructureKinds: ['intro'],
    requiredEvidenceTypes: ['claim'],
    minEvidenceCount: 1,
    unlocksTaskIds: ['task-real-innovation'],
  },
  {
    id: 'task-real-innovation',
    title: 'Identify the Real Innovation',
    question: 'What is genuinely new compared with prior work?',
    narrativeHook: 'Separate novelty from framing.',
    linkedStructureKinds: ['related-work', 'method'],
    requiredEvidenceTypes: ['comparison', 'method'],
    minEvidenceCount: 2,
    unlocksTaskIds: ['task-results-hold-up'],
  },
  {
    id: 'task-results-hold-up',
    title: 'Check Whether the Results Hold Up',
    question: 'Do the experiments support the paper\'s main claim?',
    narrativeHook: 'Follow the evidence into the experiments.',
    linkedStructureKinds: ['experiment', 'result'],
    requiredEvidenceTypes: ['result'],
    minEvidenceCount: 1,
    unlocksTaskIds: ['task-weak-point'],
  },
  {
    id: 'task-weak-point',
    title: 'Find the Weak Point',
    question: 'What limitation or unresolved risk remains?',
    narrativeHook: 'Every case has a weak point. Find it.',
    linkedStructureKinds: ['discussion', 'limitation'],
    requiredEvidenceTypes: ['limitation'],
    minEvidenceCount: 1,
    unlocksTaskIds: [],
  },
];

export class CaseSetupService {
  async generateCaseSetup(options: GenerateCaseSetupOptions): Promise<CaseSetup> {
    const { paperId, pdfText, forceRegenerate = false } = options;

    if (!forceRegenerate) {
      const cached = await dbHelpers.getCaseSetup(paperId);
      if (cached) {
        return cached;
      }
    }

    const prompt = this.buildPrompt(pdfText);
    const rawSetup = await aiService.generateStructuredData<RawCaseSetup>({
      prompt,
      maxTokens: 2000,
    });

    const caseSetup = this.normalizeCaseSetup(paperId, rawSetup);
    await dbHelpers.saveCaseSetup(caseSetup);
    return caseSetup;
  }

  private buildPrompt(pdfText: string): string {
    const maxLength = 16000;
    const truncatedText = pdfText.length > maxLength
      ? `${pdfText.slice(0, maxLength)}\n\n[truncated]`
      : pdfText;

    return [
      'You are building a suspense-light paper investigation setup.',
      'Read the paper and return structured JSON only.',
      'Your response must include a section map of the paper, a lightweight case framing, and investigation tasks.',
      'Do not invent facts absent from the paper.',
      'Identify uncertainty explicitly.',
      'Do not provide a final conclusion.',
      'Create exactly 4 investigation tasks that require text evidence from the player.',
      'Return structured JSON only with keys:',
      'caseTitle, caseBackground, coreDispute, openingJudgment, investigationGoal, structureNodes, tasks.',
      'Each structure node should include id, kind, title, summary, pageHints, importance.',
      'Each task should include id, title, question, narrativeHook, linkedStructureKinds, requiredEvidenceTypes, minEvidenceCount, unlocksTaskIds.',
      'Paper text:',
      truncatedText,
    ].join('\n\n');
  }

  private normalizeCaseSetup(paperId: number, rawSetup: RawCaseSetup): CaseSetup {
    const structureNodes = this.normalizeStructureNodes(rawSetup.structureNodes ?? []);
    const tasks = this.normalizeTasks(rawSetup.tasks ?? []);

    return {
      paperId,
      caseTitle: rawSetup.caseTitle?.trim() || 'Untitled Investigation',
      caseBackground: rawSetup.caseBackground?.trim() || 'A paper has made a claim that needs verification.',
      coreDispute: rawSetup.coreDispute?.trim() || 'The paper\'s core claim is still under review.',
      openingJudgment: rawSetup.openingJudgment?.trim() || 'The opening evidence is suggestive, not conclusive.',
      investigationGoal: rawSetup.investigationGoal?.trim() || 'Verify the paper using direct text evidence.',
      structureNodes,
      tasks,
      generatedAt: new Date().toISOString(),
      model: DEFAULT_AI_MODEL,
      source: 'ai-generated',
    };
  }

  private normalizeStructureNodes(nodes: Array<Partial<PaperStructureNode>>): PaperStructureNode[] {
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
    const sourceTasks = tasks.length > 0 ? tasks : DEFAULT_TASKS;

    return sourceTasks.slice(0, 4).map((task, index) => {
      const fallback = DEFAULT_TASKS[index] ?? DEFAULT_TASKS[DEFAULT_TASKS.length - 1];

      return {
        id: task.id?.trim() || fallback.id,
        title: task.title?.trim() || fallback.title,
        question: task.question?.trim() || fallback.question,
        narrativeHook: task.narrativeHook?.trim() || fallback.narrativeHook,
        linkedStructureKinds: this.normalizeStructureKinds(task.linkedStructureKinds, fallback.linkedStructureKinds),
        requiredEvidenceTypes: this.normalizeEvidenceTypes(task.requiredEvidenceTypes, fallback.requiredEvidenceTypes),
        minEvidenceCount: typeof task.minEvidenceCount === 'number' && task.minEvidenceCount > 0
          ? task.minEvidenceCount
          : fallback.minEvidenceCount,
        unlocksTaskIds: Array.isArray(task.unlocksTaskIds) && task.unlocksTaskIds.length > 0
          ? task.unlocksTaskIds.filter((taskId): taskId is string => typeof taskId === 'string' && taskId.length > 0)
          : fallback.unlocksTaskIds,
        status: index === 0 ? 'available' : 'locked',
      };
    });
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
}

export const caseSetupService = new CaseSetupService();
