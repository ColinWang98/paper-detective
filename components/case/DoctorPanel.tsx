'use client';

import type { DoctorState, QuestionNode } from '@/types';

interface DoctorPanelProps {
  doctorState: DoctorState | null;
  questionNodes: QuestionNode[];
}

const DOCTOR_MODE_LABELS: Record<DoctorState['mode'], string> = {
  skeptical: 'Skeptical',
  checking: 'Checking',
  'partial-confirmation': 'Partial Confirmation',
  'strong-support': 'Strong Support',
  'conflict-found': 'Conflict Found',
  'insufficient-evidence': 'Insufficient Evidence',
  'limitation-found': 'Limitation Found',
  'diagnosis-complete': 'Diagnosis Complete',
};

export function DoctorPanel({ doctorState, questionNodes }: DoctorPanelProps) {
  const activeQuestion = doctorState?.activeQuestionId
    ? questionNodes.find((question) => question.id === doctorState.activeQuestionId) ?? null
    : null;

  if (!doctorState) {
    return (
      <section className="rounded-lg border border-newspaper-border bg-white/90 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
              Bird-Head Doctor
            </h3>
            <p className="mt-2 text-lg font-semibold text-newspaper-ink">Awaiting diagnosis</p>
          </div>
          <span className="rounded-full border border-newspaper-border bg-newspaper-cream px-3 py-1 text-xs font-semibold text-newspaper-faded">
            Idle
          </span>
        </div>
        <p className="mt-3 text-sm text-newspaper-faded">
          Generate a case setup to start the investigation diagnosis.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-newspaper-border bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
            Bird-Head Doctor
          </h3>
          <p className="mt-2 text-lg font-semibold text-newspaper-ink">
            {DOCTOR_MODE_LABELS[doctorState.mode]}
          </p>
        </div>
        <span className="rounded-full border border-newspaper-border bg-newspaper-cream px-3 py-1 text-xs font-semibold text-newspaper-faded">
          {DOCTOR_MODE_LABELS[doctorState.mode]}
        </span>
      </div>

      <p className="mt-3 text-sm text-newspaper-ink">{doctorState.message}</p>

      <div className="mt-4 rounded-lg border border-newspaper-border bg-newspaper-cream/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
          Current Focus
        </p>
        <p className="mt-2 text-sm font-semibold text-newspaper-ink">
          {activeQuestion?.title ?? 'No active question selected'}
        </p>
        {activeQuestion ? (
          <p className="mt-1 text-sm text-newspaper-faded">{activeQuestion.prompt}</p>
        ) : null}
      </div>
    </section>
  );
}
