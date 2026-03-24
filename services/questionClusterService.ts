import { aiService } from '@/services/aiService';
import type { EvidenceClusterId, EvidenceSubmission, InvestigationTask } from '@/types';

export interface EvidenceClusterSuggestion {
  submissionId: number;
  clusterId: EvidenceClusterId;
  aiTags: string[];
}

interface ClusterEvidenceOptions {
  task: InvestigationTask;
  evidence: EvidenceSubmission[];
  apiKey?: string;
  model?: string;
}

interface RawClusterResult {
  assignments?: Array<{
    submissionId?: number;
    clusterId?: string;
    aiTags?: string[];
  }>;
}

const VALID_CLUSTER_IDS: EvidenceClusterId[] = [
  'supports-claim',
  'needs-skepticism',
  'open-thread',
];

export class QuestionClusterService {
  async clusterEvidence(options: ClusterEvidenceOptions): Promise<EvidenceClusterSuggestion[]> {
    const { task, evidence, apiKey, model } = options;

    if (evidence.length === 0) {
      return [];
    }

    const result = await aiService.generateStructuredData<RawClusterResult>({
      prompt: this.buildPrompt(task, evidence),
      maxTokens: 900,
      apiKey,
      model,
    });

    const validSubmissionIds = new Set(
      evidence
        .map((item) => item.id)
        .filter((id): id is number => typeof id === 'number')
    );

    return Array.isArray(result.assignments)
      ? result.assignments.flatMap((assignment) => {
          if (
            typeof assignment.submissionId !== 'number' ||
            !validSubmissionIds.has(assignment.submissionId) ||
            !VALID_CLUSTER_IDS.includes(assignment.clusterId as EvidenceClusterId)
          ) {
            return [];
          }

          return [
            {
              submissionId: assignment.submissionId,
              clusterId: assignment.clusterId as EvidenceClusterId,
              aiTags: Array.isArray(assignment.aiTags)
                ? assignment.aiTags.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                : [],
            },
          ];
        })
      : [];
  }

  private buildPrompt(task: InvestigationTask, evidence: EvidenceSubmission[]): string {
    return [
      'You are clustering evidence in a paper investigation workflow.',
      'Return strict JSON only.',
      'Use one top-level key: assignments.',
      'assignments must be a JSON array of objects with keys: submissionId, clusterId, aiTags.',
      'clusterId must be one of: supports-claim, needs-skepticism, open-thread.',
      'aiTags must be a short JSON array of 1-3 lowercase tags.',
      'Do not omit evidence items. Every evidence item must appear once.',
      `Question title: ${task.title}`,
      `Question: ${task.question}`,
      `Section: ${task.section}`,
      `Evaluation focus: ${task.evaluationFocus}`,
      'Evidence items:',
      ...evidence.map((item) => {
        const identifier = typeof item.id === 'number' ? item.id : -1;
        return `- submissionId=${identifier}; type=${item.evidenceType}; note=${item.note}`;
      }),
    ].join('\n');
  }
}

export const questionClusterService = new QuestionClusterService();
