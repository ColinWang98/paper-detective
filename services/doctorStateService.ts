import type { DoctorMode, DoctorState, QuestionNode, QuestionRelation } from '@/types';

interface DeriveDoctorStateInput {
  paperId: number;
  questionNodes: QuestionNode[];
  questionRelations: QuestionRelation[];
  previousDoctorState?: DoctorState | null;
}

const QUESTION_PRIORITY: Record<QuestionNode['type'], number> = {
  claim: 0,
  evidence: 1,
  method: 2,
  limitation: 3,
};

export function deriveDoctorState({
  paperId,
  questionNodes,
  questionRelations,
  previousDoctorState = null,
}: DeriveDoctorStateInput): DoctorState | null {
  if (questionNodes.length === 0) {
    return null;
  }

  const conflictedQuestion = questionNodes.find((question) => question.status === 'conflicted');
  if (conflictedQuestion) {
    return buildDoctorState(
      paperId,
      'conflict-found',
      conflictedQuestion.id,
      `A contradiction is blocking progress around "${conflictedQuestion.title}". Resolve the conflict before trusting the current diagnosis.`
    );
  }

  const limitationQuestion = questionNodes.find(
    (question) =>
      question.type === 'limitation' &&
      (question.status === 'limited' || question.assignedEvidenceIds.length > 0)
  );
  if (limitationQuestion) {
    return buildDoctorState(
      paperId,
      'limitation-found',
      limitationQuestion.id,
      `A real limitation has surfaced in "${limitationQuestion.title}". Re-check how much it narrows the main claim.`
    );
  }

  const claimQuestions = questionNodes.filter((question) => question.type === 'claim');
  const unsupportedClaim = claimQuestions.find((question) => question.assignedEvidenceIds.length === 0);
  if (unsupportedClaim) {
    return buildDoctorState(
      paperId,
      'skeptical',
      unsupportedClaim.id,
      `The core claim in "${unsupportedClaim.title}" still lacks direct evidence. Lock the claim before moving deeper.`
    );
  }

  const incompleteQuestion = pickHighestPriorityQuestion(
    questionNodes.filter((question) => question.status === 'open' || question.status === 'partial')
  );
  if (incompleteQuestion) {
    const mode: DoctorMode =
      incompleteQuestion.assignedEvidenceIds.length > 0 ? 'partial-confirmation' : 'checking';
    const message =
      incompleteQuestion.assignedEvidenceIds.length > 0
        ? `Evidence is accumulating for "${incompleteQuestion.title}", but the diagnosis is not stable yet. Tighten the answer before you trust it.`
        : `The next unresolved question is "${incompleteQuestion.title}". Gather direct evidence before drawing a stronger conclusion.`;
    return buildDoctorState(paperId, mode, incompleteQuestion.id, message);
  }

  const allResolved = questionNodes.every(
    (question) => question.status === 'supported' || question.status === 'limited'
  );
  if (allResolved) {
    const focusQuestion =
      pickHighestPriorityQuestion(questionNodes.filter((question) => question.status === 'supported')) ??
      questionNodes[0];
    const hasLimitationRelation = questionRelations.some(
      (relation) => relation.relationType === 'limitation-of'
    );
    return buildDoctorState(
      paperId,
      hasLimitationRelation ? 'diagnosis-complete' : 'strong-support',
      focusQuestion.id,
      hasLimitationRelation
        ? 'The main diagnostic questions are resolved. The conclusion is usable, but the mapped limitations still constrain confidence.'
        : 'The question graph is coherent and strongly supported. The current diagnosis has solid backing.'
    );
  }

  const fallbackQuestion = previousDoctorState?.activeQuestionId
    ? questionNodes.find((question) => question.id === previousDoctorState.activeQuestionId) ?? null
    : null;

  return buildDoctorState(
    paperId,
    'insufficient-evidence',
    fallbackQuestion?.id ?? questionNodes[0].id,
    'The investigation is moving, but the evidence is still too thin to produce a stable diagnosis.'
  );
}

function buildDoctorState(
  paperId: number,
  mode: DoctorMode,
  activeQuestionId: string | null,
  message: string
): DoctorState {
  return {
    paperId,
    activeQuestionId,
    mode,
    message,
    updatedAt: new Date().toISOString(),
  };
}

function pickHighestPriorityQuestion(questionNodes: QuestionNode[]): QuestionNode | null {
  if (questionNodes.length === 0) {
    return null;
  }

  return [...questionNodes].sort((left, right) => {
    const typeDelta = QUESTION_PRIORITY[left.type] - QUESTION_PRIORITY[right.type];
    if (typeDelta !== 0) {
      return typeDelta;
    }

    return left.title.localeCompare(right.title);
  })[0];
}
