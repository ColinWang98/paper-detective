'use client';

import type { EvidenceSubmission, Highlight, InvestigationTask } from '@/types';

interface EvidenceBoxTabProps {
  activeTask: InvestigationTask | null;
  evidenceSubmissions: EvidenceSubmission[];
  highlights: Highlight[];
  evaluationError?: string | null;
  isEvaluating?: boolean;
  judgment: string;
  onJudgmentChange: (value: string) => void;
  onSubmitQuestion: () => void;
}

export function EvidenceBoxTab({
  activeTask,
  evidenceSubmissions,
  highlights,
  evaluationError = null,
  isEvaluating = false,
  judgment,
  onJudgmentChange,
  onSubmitQuestion,
}: EvidenceBoxTabProps) {
  if (!activeTask) {
    return (
      <div className="rounded-lg border border-dashed border-newspaper-border bg-white/60 p-4 text-sm text-newspaper-faded">
        Select a question to inspect its evidence box.
      </div>
    );
  }

  const taskEvidence = evidenceSubmissions.filter((submission) => submission.taskId === activeTask.id);
  const archivedEvidence = evidenceSubmissions.filter((submission) => submission.taskId !== activeTask.id);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-newspaper-border bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-newspaper-faded">
          Current Question
        </p>
        <h3 className="mt-2 text-base font-semibold text-newspaper-ink">{activeTask.title}</h3>
        <p className="mt-1 text-sm text-newspaper-faded">{activeTask.question}</p>
        <div className="mt-3 space-y-1 text-xs text-newspaper-faded">
          <p>
            <span className="font-semibold text-newspaper-ink">Where to look:</span>{' '}
            {activeTask.whereToLook.join(' / ')}
          </p>
          <p>
            <span className="font-semibold text-newspaper-ink">Submission mode:</span>{' '}
            {activeTask.submissionMode === 'evidence_only' ? 'Evidence only' : 'Evidence + optional judgment'}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-newspaper-border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-newspaper-ink">Current Evidence Box</h3>
          <span className="rounded-full bg-newspaper-aged px-2 py-1 text-xs text-newspaper-faded">
            {taskEvidence.length} item{taskEvidence.length === 1 ? '' : 's'}
          </span>
        </div>

        {taskEvidence.length === 0 ? (
          <p className="mt-3 text-sm text-newspaper-faded">
            No evidence submitted for this question yet.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {taskEvidence.map((submission) => {
              const sourceHighlight = highlights.find((highlight) => highlight.id === submission.highlightId);
              return (
                <div
                  key={submission.id ?? `${submission.taskId}-${submission.highlightId}`}
                  className="rounded border border-newspaper-border bg-newspaper-cream p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-newspaper-faded">
                    {submission.evidenceType}
                  </p>
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-newspaper-ink">Evidence Archive</h3>
          <span className="rounded-full bg-newspaper-aged px-2 py-1 text-xs text-newspaper-faded">
            {evidenceSubmissions.length} total
          </span>
        </div>

        {evidenceSubmissions.length === 0 ? (
          <p className="mt-3 text-sm text-newspaper-faded">
            No evidence has been submitted yet.
          </p>
        ) : (
          <div className="mt-3 max-h-56 space-y-3 overflow-y-auto pr-1">
            {evidenceSubmissions.map((submission) => {
              const sourceHighlight = highlights.find((highlight) => highlight.id === submission.highlightId);
              const isCurrentTask = submission.taskId === activeTask.id;
              return (
                <div
                  key={`archive-${submission.id ?? `${submission.taskId}-${submission.highlightId}`}`}
                  className={`rounded border p-3 ${
                    isCurrentTask
                      ? 'border-newspaper-accent bg-newspaper-cream'
                      : 'border-newspaper-border bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-newspaper-faded">
                      {submission.evidenceType}
                    </p>
                    <span className="text-[11px] text-newspaper-faded">
                      {isCurrentTask ? 'Current question' : submission.taskId}
                    </span>
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

        {archivedEvidence.length > 0 ? (
          <p className="mt-3 text-xs text-newspaper-faded">
            {archivedEvidence.length} archived item{archivedEvidence.length === 1 ? '' : 's'} belong to other questions.
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-newspaper-border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-newspaper-ink">Submit This Question</h3>
            <p className="mt-1 text-xs text-newspaper-faded">
              {activeTask.submissionMode === 'evidence_only'
                ? 'This question can be scored from evidence alone.'
                : 'You may add a short judgment before scoring this question.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onSubmitQuestion}
            disabled={isEvaluating || taskEvidence.length === 0}
            className="rounded bg-newspaper-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEvaluating ? 'Scoring...' : 'Submit Question'}
          </button>
        </div>

        {activeTask.submissionMode === 'evidence_plus_optional_judgment' ? (
          <label className="mt-4 block text-sm font-medium text-newspaper-ink">
            Optional judgment
            <textarea
              className="mt-1 min-h-24 w-full rounded border border-newspaper-border p-2"
              value={judgment}
              onChange={(event) => onJudgmentChange(event.target.value)}
            />
          </label>
        ) : null}

        {evaluationError ? (
          <p className="mt-3 text-sm text-red-700">{evaluationError}</p>
        ) : null}

        {typeof activeTask.score === 'number' || activeTask.feedback ? (
          <div className="mt-4 rounded border border-newspaper-border bg-newspaper-cream p-3">
            {typeof activeTask.score === 'number' ? (
              <p className="text-sm font-semibold text-newspaper-ink">Score: {activeTask.score}/100</p>
            ) : null}
            {activeTask.feedback ? (
              <p className="mt-2 text-sm text-newspaper-faded">{activeTask.feedback}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
