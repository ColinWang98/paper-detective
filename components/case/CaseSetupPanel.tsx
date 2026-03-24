'use client';

import { AlertCircle, Key } from 'lucide-react';

import type { CaseSetup, EvidenceType, InvestigationTaskStatus, PaperStructureKind } from '@/types';

interface CaseSetupPanelProps {
  caseSetup: CaseSetup | null;
  errorMessage?: string | null;
  isGenerating?: boolean;
  progress?: number;
  progressLabel?: string;
  onBeginInvestigation: () => void;
  onSelectTask?: (taskId: string) => void;
  onConfigureAPIKey?: () => void;
  onRetryGeneration?: () => void;
}

export function CaseSetupPanel({
  caseSetup,
  errorMessage,
  isGenerating = false,
  progress = 0,
  progressLabel = 'Preparing investigation setup',
  onBeginInvestigation,
  onSelectTask,
  onConfigureAPIKey,
  onRetryGeneration,
}: CaseSetupPanelProps) {
  const formatStructureKinds = (kinds: PaperStructureKind[]) =>
    kinds.map((kind) => STRUCTURE_KIND_LABELS[kind] ?? kind).join(' / ');

  const formatEvidenceTypes = (types: EvidenceType[]) =>
    types.map((type) => EVIDENCE_TYPE_LABELS[type] ?? type).join(', ');

  const summarizeText = (text: string | undefined, maxLength = 220) => {
    if (!text) {
      return '';
    }

    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }

    const sentenceCut = normalized.slice(0, maxLength).match(/^(.+[.!?。！？])\s/);
    if (sentenceCut?.[1]) {
      return sentenceCut[1];
    }

    return `${normalized.slice(0, maxLength).trim()}...`;
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-newspaper-cream text-newspaper-ink">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-newspaper-faded">
            Case Setup
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            {caseSetup?.caseTitle ?? 'Preparing investigation setup'}
          </h2>
        </div>

        <div className="rounded-lg border border-newspaper-border bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-newspaper-faded">
            Story Background
          </p>
          <p className="mt-2 text-sm leading-6 text-newspaper-faded">
            {caseSetup
              ? summarizeText(caseSetup.caseBackground, 280)
              : 'The system is preparing a structure map and investigation tasks for this paper.'}
          </p>
        </div>

        {isGenerating ? (
          <div className="rounded-lg border border-newspaper-border bg-white/70 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-newspaper-faded">
              <span>{progressLabel}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-newspaper-border">
              <div
                className="h-full rounded-full bg-newspaper-accent transition-[width] duration-500"
                style={{ width: `${Math.max(6, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-semibold">Case setup generation failed</p>
                <p>{errorMessage}</p>
                {onConfigureAPIKey ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onConfigureAPIKey}
                      className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                    >
                      <Key className="h-4 w-4" />
                      配置 API Key
                    </button>
                    {onRetryGeneration ? (
                      <button
                        type="button"
                        onClick={onRetryGeneration}
                        className="inline-flex items-center gap-2 rounded-md bg-newspaper-ink px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
                      >
                        重试生成
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {caseSetup ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-newspaper-border bg-white p-4 text-sm leading-6">
              <p>
                <span className="font-semibold">Core dispute:</span>{' '}
                {summarizeText(caseSetup.coreDispute, 180)}
              </p>
              <p className="mt-2">
                <span className="font-semibold">Opening judgment:</span>{' '}
                {summarizeText(caseSetup.openingJudgment, 180)}
              </p>
              <p className="mt-2">
                <span className="font-semibold">Investigation goal:</span>{' '}
                {summarizeText(caseSetup.investigationGoal, 180)}
              </p>
              {caseSetup.structureNodes.length > 0 ? (
                <p className="mt-2 text-xs text-newspaper-faded">
                  Detected structure: {caseSetup.structureNodes.length} sections
                </p>
              ) : null}
            </div>

            <details className="rounded-lg border border-newspaper-border bg-white/80 p-4 text-sm text-newspaper-faded">
              <summary className="cursor-pointer font-semibold text-newspaper-ink">
                View detailed case notes
              </summary>
              <div className="mt-3 space-y-3 leading-6">
                <p>{caseSetup.caseBackground}</p>
                <p>
                  <span className="font-semibold text-newspaper-ink">Core dispute:</span> {caseSetup.coreDispute}
                </p>
                <p>
                  <span className="font-semibold text-newspaper-ink">Opening judgment:</span> {caseSetup.openingJudgment}
                </p>
                <p>
                  <span className="font-semibold text-newspaper-ink">Investigation goal:</span> {caseSetup.investigationGoal}
                </p>
              </div>
            </details>
          </div>
        ) : null}

        {caseSetup?.tasks.length ? (
          <div className="space-y-3 pt-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-newspaper-faded">
                Investigation Tasks
              </p>
              <p className="mt-1 text-xs text-newspaper-faded">
                Each task tells you where to look, what kind of evidence to collect, and how many submissions unlock the next step.
              </p>
            </div>

            <div className="space-y-3">
              {caseSetup.tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => {
                    if (task.status !== 'locked') {
                      onSelectTask?.(task.id);
                    }
                  }}
                  disabled={task.status === 'locked'}
                  className="w-full rounded-lg border border-newspaper-border bg-white/70 p-4 text-left transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-newspaper-ink">{task.title}</p>
                      <p className="mt-1 text-sm text-newspaper-faded">{task.question}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${TASK_STATUS_STYLES[task.status] ?? TASK_STATUS_STYLES.locked}`}>
                      {TASK_STATUS_LABELS[task.status] ?? task.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-newspaper-faded">
                    <p>
                      <span className="font-semibold text-newspaper-ink">Where to look:</span>{' '}
                      {formatStructureKinds(task.linkedStructureKinds)}
                    </p>
                    <p>
                      <span className="font-semibold text-newspaper-ink">What to collect:</span>{' '}
                      {formatEvidenceTypes(task.requiredEvidenceTypes)}
                    </p>
                    <p>
                      <span className="font-semibold text-newspaper-ink">Completion rule:</span>{' '}
                      Submit at least {task.minEvidenceCount} piece{task.minEvidenceCount > 1 ? 's' : ''} of evidence, covering all listed evidence types.
                    </p>
                    <p>
                      <span className="font-semibold text-newspaper-ink">Why it matters:</span>{' '}
                      {task.narrativeHook}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-newspaper-border bg-newspaper-cream/95 p-6 backdrop-blur">
        <div className="flex flex-wrap gap-3">
          {!caseSetup && onRetryGeneration ? (
            <button
              type="button"
              onClick={onRetryGeneration}
              className="rounded-md border border-newspaper-ink px-4 py-2 text-sm font-semibold text-newspaper-ink disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating Case Setup...' : 'Generate Case Setup'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onBeginInvestigation}
            className="rounded-md bg-newspaper-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!caseSetup || isGenerating}
          >
            Begin Investigation
          </button>
        </div>
      </div>
    </div>
  );
}

const STRUCTURE_KIND_LABELS: Record<PaperStructureKind, string> = {
  intro: 'Introduction',
  'related-work': 'Related Work',
  method: 'Method',
  implementation: 'Implementation',
  experiment: 'Experiment',
  result: 'Result',
  discussion: 'Discussion',
  limitation: 'Limitation',
  other: 'Other',
};

const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  claim: 'core claim',
  comparison: 'comparison evidence',
  method: 'method detail',
  result: 'result evidence',
  limitation: 'limitation evidence',
};

const TASK_STATUS_LABELS: Record<InvestigationTaskStatus, string> = {
  locked: 'Locked',
  available: 'Available',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const TASK_STATUS_STYLES: Record<InvestigationTaskStatus, string> = {
  locked: 'bg-gray-200 text-gray-700',
  available: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
};
