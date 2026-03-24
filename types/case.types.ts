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
export type QuestionSection = 'intro' | 'related-work' | 'method' | 'result' | 'discussion' | 'other';
export type TaskSubmissionMode = 'evidence_only' | 'evidence_plus_optional_judgment';
export type EvidenceClusterId = 'supports-claim' | 'needs-skepticism' | 'open-thread';
export type EvidenceRelationshipType = 'supports' | 'contradicts' | 'extends' | 'open-question';
export type DeductionRelationType = 'support' | 'contrast' | 'method' | 'limitation';

export interface InvestigationTask {
  id: string;
  title: string;
  question: string;
  narrativeHook: string;
  section: QuestionSection;
  whereToLook: string[];
  whatToFind: string;
  submissionMode: TaskSubmissionMode;
  recommendedEvidenceCount: number;
  evaluationFocus: string;
  score?: number;
  feedback?: string;
  submittedAt?: string;
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
  sourceSection?: QuestionSection;
  userInterpretation?: string;
  aiTags?: string[];
  clusterId?: EvidenceClusterId;
  scoreContribution?: number;
  createdAt: string;
}

export interface EvidenceRelationship {
  id?: number;
  paperId: number;
  taskId: string;
  fromSubmissionId: number;
  toSubmissionId: number;
  relationshipType: EvidenceRelationshipType;
  note?: string;
  createdAt: string;
}

export interface DeductionGraphNode {
  id: string;
  paperId: number;
  taskId: string;
  submissionId: number;
  position: {
    x: number;
    y: number;
  };
  type: 'evidenceBubble';
  data: {
    title: string;
    summary: string;
    sourceText?: string | null;
    pageNumber?: number | null;
    evidenceType: EvidenceType;
    tags: string[];
  };
}

export interface DeductionGraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: DeductionRelationType;
  note?: string;
  createdAt: string;
}

export interface DeductionGraph {
  id?: number;
  paperId: number;
  taskId: string;
  nodes: DeductionGraphNode[];
  edges: DeductionGraphEdge[];
  updatedAt: string;
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
