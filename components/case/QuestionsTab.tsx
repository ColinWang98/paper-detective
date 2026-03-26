'use client';

import type { QuestionNode } from '@/types';

interface QuestionsTabProps {
  questionNodes: QuestionNode[];
  activeQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionNode['type'], string> = {
  claim: 'Claim',
  evidence: 'Evidence',
  method: 'Method',
  limitation: 'Limitation',
};

const QUESTION_STATUS_LABELS: Record<QuestionNode['status'], string> = {
  open: 'Open',
  partial: 'Partial',
  supported: 'Supported',
  conflicted: 'Conflicted',
  limited: 'Limited',
};

const QUESTION_STATUS_STYLES: Record<QuestionNode['status'], string> = {
  open: 'bg-amber-100 text-amber-800',
  partial: 'bg-blue-100 text-blue-800',
  supported: 'bg-emerald-100 text-emerald-800',
  conflicted: 'bg-rose-100 text-rose-800',
  limited: 'bg-orange-100 text-orange-800',
};

export function QuestionsTab({
  questionNodes,
  activeQuestionId,
  onSelectQuestion,
}: QuestionsTabProps) {
  if (questionNodes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-newspaper-border bg-white/60 p-4 text-sm text-newspaper-faded">
        No investigation questions yet. Generate a case setup first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-newspaper-border bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-newspaper-faded">
          Question Map
        </p>
        <p className="mt-2 text-sm text-newspaper-faded">
          Review the structured investigation questions and move through the paper one question at a time.
        </p>
        <p className="mt-2 text-xs text-newspaper-faded">
          {questionNodes.length} question{questionNodes.length === 1 ? '' : 's'} available
        </p>
      </div>

      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {questionNodes.map((question) => {
          const isActive = question.id === activeQuestionId;
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelectQuestion(question.id)}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                isActive
                  ? 'border-newspaper-accent bg-white shadow-sm'
                  : 'border-newspaper-border bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-newspaper-ink">{question.title}</p>
                  <p className="mt-1 text-sm text-newspaper-faded">{question.prompt}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full border border-newspaper-border px-2 py-1 text-[11px] font-semibold text-newspaper-faded">
                    {QUESTION_TYPE_LABELS[question.type]}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${QUESTION_STATUS_STYLES[question.status]}`}>
                    {QUESTION_STATUS_LABELS[question.status]}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-newspaper-faded">
                <p>
                  <span className="font-semibold text-newspaper-ink">Dependencies:</span>{' '}
                  {question.dependsOnQuestionIds.length === 0
                    ? 'No prerequisites'
                    : `Depends on ${question.dependsOnQuestionIds.length} question${question.dependsOnQuestionIds.length === 1 ? '' : 's'}`}
                </p>
                <p>
                  <span className="font-semibold text-newspaper-ink">Attached evidence:</span>{' '}
                  {question.assignedEvidenceIds.length} attached evidence
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
