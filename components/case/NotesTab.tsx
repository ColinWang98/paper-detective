'use client';

import type {
  EvidenceSubmission,
  Highlight,
  InvestigationTask,
  QuestionNode,
  QuestionNodeType,
} from '@/types';

interface NotesTabProps {
  activeQuestion: QuestionNode | null;
  activeTask: InvestigationTask | null;
  evidenceSubmissions: EvidenceSubmission[];
  highlights: Highlight[];
  evaluationError?: string | null;
  isEvaluating?: boolean;
  judgment: string;
  onJudgmentChange: (value: string) => void;
  onSubmitQuestion: () => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionNodeType, string> = {
  claim: 'Claim question',
  evidence: 'Evidence question',
  method: 'Method question',
  limitation: 'Limitation question',
};

const QUESTION_STATUS_LABELS: Record<QuestionNode['status'], string> = {
  open: 'Open',
  partial: 'Partial',
  supported: 'Supported',
  conflicted: 'Conflicted',
  limited: 'Limited',
};

export function NotesTab({
  activeQuestion,
  activeTask,
  evidenceSubmissions,
  highlights,
  evaluationError = null,
  isEvaluating = false,
  judgment,
  onJudgmentChange,
  onSubmitQuestion,
}: NotesTabProps) {
  if (!activeQuestion) {
    return (
      <div className="rounded-lg border border-dashed border-newspaper-border bg-white/60 p-4 text-sm text-newspaper-faded">
        Select a question to open its notes workspace.
      </div>
    );
  }

  const attachedEvidence = evidenceSubmissions.filter((submission) =>
    typeof submission.id === 'number' && activeQuestion.assignedEvidenceIds.includes(submission.id)
  );

  const score = activeQuestion.score ?? activeTask?.score;
  const feedback = activeQuestion.feedback ?? activeTask?.feedback ?? null;
  const allowsJudgment = activeTask?.submissionMode === 'evidence_plus_optional_judgment';

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-newspaper-border bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-newspaper-faded">
          Question Workspace
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-newspaper-ink">{activeQuestion.title}</h3>
            <p className="mt-1 text-sm text-newspaper-faded">{activeQuestion.prompt}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-newspaper-border px-2 py-1 text-[11px] font-semibold text-newspaper-faded">
              {QUESTION_TYPE_LABELS[activeQuestion.type]}
            </span>
            <span className="rounded-full bg-newspaper-aged px-2 py-1 text-[11px] font-semibold text-newspaper-faded">
              {QUESTION_STATUS_LABELS[activeQuestion.status]}
            </span>
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-xs text-newspaper-faded md:grid-cols-2">
          <p>
            <span className="font-semibold text-newspaper-ink">Dependencies:</span>{' '}
            {activeQuestion.dependsOnQuestionIds.length === 0
              ? 'No prerequisites'
              : `${activeQuestion.dependsOnQuestionIds.length} linked question${activeQuestion.dependsOnQuestionIds.length === 1 ? '' : 's'}`}
          </p>
          <p>
            <span className="font-semibold text-newspaper-ink">Attached evidence:</span>{' '}
            {attachedEvidence.length} attached evidence
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-newspaper-border bg-white p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-newspaper-ink">Question Evidence</h4>
            <span className="rounded-full bg-newspaper-aged px-2 py-1 text-xs text-newspaper-faded">
              {attachedEvidence.length} item{attachedEvidence.length === 1 ? '' : 's'}
            </span>
          </div>

          {attachedEvidence.length === 0 ? (
            <p className="mt-3 text-sm text-newspaper-faded">
              Submit evidence for this question to start building a defensible answer.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {attachedEvidence.map((submission) => {
                const sourceHighlight = highlights.find((highlight) => highlight.id === submission.highlightId);
                return (
                  <div
                    key={submission.id ?? `${submission.taskId}-${submission.highlightId}`}
                    className="rounded border border-newspaper-border bg-newspaper-cream p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-newspaper-faded">
                        {submission.evidenceType}
                      </p>
                      {sourceHighlight?.pageNumber ? (
                        <span className="text-[11px] text-newspaper-faded">
                          Page {sourceHighlight.pageNumber}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-newspaper-ink">{submission.note}</p>
                    {sourceHighlight ? (
                      <p className="mt-2 text-xs text-newspaper-faded">Source: {sourceHighlight.text}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-newspaper-border bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-newspaper-ink">Answer Workspace</h4>
              <p className="mt-1 text-xs text-newspaper-faded">
                Consolidate the attached evidence into a defensible answer for this question.
              </p>
            </div>
            <button
              type="button"
              onClick={onSubmitQuestion}
              disabled={isEvaluating || attachedEvidence.length === 0}
              className="rounded bg-newspaper-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEvaluating ? 'Scoring...' : 'Submit Question'}
            </button>
          </div>

          {allowsJudgment ? (
            <label className="mt-4 block text-sm font-medium text-newspaper-ink">
              Optional answer
              <textarea
                aria-label="Optional answer"
                className="mt-1 min-h-28 w-full rounded border border-newspaper-border p-2"
                value={judgment}
                onChange={(event) => onJudgmentChange(event.target.value)}
                placeholder="Optional. Summarize how the attached evidence answers this question."
              />
            </label>
          ) : null}

          {!allowsJudgment ? (
            <p className="mt-4 rounded border border-dashed border-newspaper-border bg-newspaper-cream p-3 text-sm text-newspaper-faded">
              This question can be scored from evidence alone. Add more evidence if the support still feels thin.
            </p>
          ) : null}

          {evaluationError ? (
            <p className="mt-3 text-sm text-red-700">{evaluationError}</p>
          ) : null}

          {typeof score === 'number' || feedback ? (
            <div className="mt-4 rounded border border-newspaper-border bg-newspaper-cream p-3">
              {typeof score === 'number' ? (
                <p className="text-sm font-semibold text-newspaper-ink">Score: {score}/100</p>
              ) : null}
              {feedback ? (
                <p className="mt-2 text-sm text-newspaper-faded">{feedback}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
