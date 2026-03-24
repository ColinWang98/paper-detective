import { aiService } from '@/services/aiService';
import type { EvidenceSubmission, InvestigationTask } from '@/types';

export interface QuestionEvaluationResult {
  score: number;
  feedback: string;
  missingEvidence: string[];
}

interface EvaluateQuestionOptions {
  task: InvestigationTask;
  evidence: EvidenceSubmission[];
  judgment?: string;
  apiKey?: string;
  model?: string;
}

interface RawQuestionEvaluationResult {
  score?: number;
  feedback?: string;
  missingEvidence?: string[];
}

export class QuestionEvaluationService {
  async evaluateQuestion(options: EvaluateQuestionOptions): Promise<QuestionEvaluationResult> {
    const { task, evidence, judgment, apiKey, model } = options;
    const missingEvidence = this.collectMissingEvidence(task, evidence);

    if (missingEvidence.length > 0 || evidence.length < task.minEvidenceCount) {
      return {
        score: Math.max(20, 70 - missingEvidence.length * 15 - Math.max(0, task.minEvidenceCount - evidence.length) * 10),
        feedback: 'The submission is still missing required evidence coverage for this question.',
        missingEvidence,
      };
    }

    const prompt = this.buildPrompt(task, evidence, judgment);
    const result = await aiService.generateStructuredData<RawQuestionEvaluationResult>({
      prompt,
      maxTokens: 900,
      apiKey,
      model,
    });

    return {
      score: this.normalizeScore(result.score),
      feedback: result.feedback?.trim() || 'The submission addresses the question with usable evidence.',
      missingEvidence: Array.isArray(result.missingEvidence)
        ? result.missingEvidence.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [],
    };
  }

  private buildPrompt(
    task: InvestigationTask,
    evidence: EvidenceSubmission[],
    judgment?: string
  ): string {
    return [
      'You are evaluating one investigation question in a paper-reading detective workflow.',
      'Return strict JSON only.',
      'Use keys: score, feedback, missingEvidence.',
      'score must be an integer from 0 to 100.',
      'feedback must be 1-3 sentences and refer to evidence quality, not general encouragement.',
      'missingEvidence must be a JSON array of short strings.',
      `Question title: ${task.title}`,
      `Question: ${task.question}`,
      `Submission mode: ${task.submissionMode}`,
      `Evaluation focus: ${task.evaluationFocus}`,
      `Required evidence types: ${task.requiredEvidenceTypes.join(', ')}`,
      'Evidence:',
      ...evidence.map((item, index) => `${index + 1}. [${item.evidenceType}] ${item.note}`),
      judgment ? `Player judgment: ${judgment}` : 'Player judgment: none provided',
    ].join('\n');
  }

  private collectMissingEvidence(task: InvestigationTask, evidence: EvidenceSubmission[]): string[] {
    const collectedTypes = new Set(evidence.map((item) => item.evidenceType));
    const missingTypes = task.requiredEvidenceTypes
      .filter((type) => !collectedTypes.has(type))
      .map((type) => `Missing evidence type: ${type}`);

    if (evidence.length < task.minEvidenceCount) {
      missingTypes.push(`Add ${task.minEvidenceCount - evidence.length} more evidence item(s).`);
    }

    return missingTypes;
  }

  private normalizeScore(score: number | undefined): number {
    if (typeof score !== 'number' || Number.isNaN(score)) {
      return 75;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }
}

export const questionEvaluationService = new QuestionEvaluationService();
