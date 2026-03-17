import type { AIModel } from './ai.types';

export type PaperStructureKind =
  | 'intro'
  | 'related-work'
  | 'method'
  | 'implementation'
  | 'experiment'
  | 'result'
  | 'discussion'
  | 'limitation'
  | 'other';

export type PaperStructureImportance = 'critical' | 'important' | 'supporting';
export type PaperStructureStatus = 'unseen' | 'investigating' | 'confirmed' | 'disputed';

export interface PaperStructureNode {
  id: string;
  kind: PaperStructureKind;
  title: string;
  summary: string;
  pageHints: number[];
  importance: PaperStructureImportance;
  status: PaperStructureStatus;
}

export type EvidenceType = 'claim' | 'comparison' | 'method' | 'result' | 'limitation';
export type InvestigationTaskStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface InvestigationTask {
  id: string;
  title: string;
  question: string;
  narrativeHook: string;
  linkedStructureKinds: PaperStructureNode['kind'][];
  requiredEvidenceTypes: EvidenceType[];
  minEvidenceCount: number;
  unlocksTaskIds: string[];
  status: InvestigationTaskStatus;
}

export interface EvidenceSubmission {
  id?: number;
  paperId: number;
  taskId: string;
  highlightId: number;
  evidenceType: EvidenceType;
  note: string;
  createdAt: string;
}

export interface TaskProgress {
  taskId: string;
  status: InvestigationTaskStatus;
  evidenceCount: number;
  requiredEvidenceMet: boolean;
  completedAt?: string;
}

export interface CaseProgressSnapshot {
  paperId: number;
  activeTaskId: string | null;
  completedTaskIds: string[];
  unlockedTaskIds: string[];
  progressPercent: number;
  updatedAt: string;
}

export interface CaseSetup {
  id?: number;
  paperId: number;
  caseTitle: string;
  caseBackground: string;
  coreDispute: string;
  openingJudgment: string;
  investigationGoal: string;
  structureNodes: PaperStructureNode[];
  tasks: InvestigationTask[];
  generatedAt: string;
  model: AIModel;
  source: 'ai-generated' | 'cache';
}
