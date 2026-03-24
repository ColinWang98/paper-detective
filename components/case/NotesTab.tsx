'use client';

import { useEffect, useState } from 'react';

import type {
  EvidenceClusterId,
  EvidenceSubmission,
  Highlight,
  InvestigationTask,
} from '@/types';

interface NotesTabProps {
  activeTask: InvestigationTask | null;
  evidenceSubmissions: EvidenceSubmission[];
  highlights: Highlight[];
  evaluationError?: string | null;
  isEvaluating?: boolean;
  judgment: string;
  onJudgmentChange: (value: string) => void;
  onSubmitQuestion: () => void;
  onAssignCluster: (submissionId: number, clusterId: EvidenceClusterId | null) => void;
  onUpdateTags: (submissionId: number, aiTags: string[]) => void;
  onAIAutoCluster: () => void;
  isAIClustering?: boolean;
  aiClusterError?: string | null;
}

const CLUSTERS: Array<{
  id: EvidenceClusterId;
  title: string;
  description: string;
  accentClass: string;
}> = [
  {
    id: 'supports-claim',
    title: 'Supports Claim',
    description: 'Evidence that directly backs the author claim.',
    accentClass: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  },
  {
    id: 'needs-skepticism',
    title: 'Needs Skepticism',
    description: 'Evidence that narrows, weakens, or complicates the claim.',
    accentClass: 'border-rose-300 bg-rose-50 text-rose-900',
  },
  {
    id: 'open-thread',
    title: 'Open Thread',
    description: 'Useful evidence that still needs interpretation.',
    accentClass: 'border-amber-300 bg-amber-50 text-amber-900',
  },
];

export function NotesTab({
  activeTask,
  evidenceSubmissions,
  highlights,
  evaluationError = null,
  isEvaluating = false,
  judgment,
  onJudgmentChange,
  onSubmitQuestion,
  onAssignCluster,
  onUpdateTags,
  onAIAutoCluster,
  isAIClustering = false,
  aiClusterError = null,
}: NotesTabProps) {
  if (!activeTask) {
    return (
      <div className="rounded-lg border border-dashed border-newspaper-border bg-white/60 p-4 text-sm text-newspaper-faded">
        Select a question to open its notes workspace.
      </div>
    );
  }

  const taskEvidence = evidenceSubmissions.filter((submission) => submission.taskId === activeTask.id);
  const archivedEvidence = evidenceSubmissions.filter((submission) => submission.taskId !== activeTask.id);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-newspaper-border bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-newspaper-faded">
          Notes Workspace
        </p>
        <h3 className="mt-2 text-base font-semibold text-newspaper-ink">{activeTask.title}</h3>
        <p className="mt-1 text-sm text-newspaper-faded">{activeTask.question}</p>
        <div className="mt-3 grid gap-2 text-xs text-newspaper-faded md:grid-cols-2">
          <p>
            <span className="font-semibold text-newspaper-ink">Where to look:</span>{' '}
            {activeTask.whereToLook.join(' / ')}
          </p>
          <p>
            <span className="font-semibold text-newspaper-ink">What to collect:</span>{' '}
            {activeTask.whatToFind}
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-newspaper-border bg-white p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-newspaper-ink">Current Evidence Box</h4>
            <span className="rounded-full bg-newspaper-aged px-2 py-1 text-xs text-newspaper-faded">
              {taskEvidence.length} item{taskEvidence.length === 1 ? '' : 's'}
            </span>
          </div>

          {taskEvidence.length === 0 ? (
            <p className="mt-3 text-sm text-newspaper-faded">
              Submit evidence for this question to start building notes.
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-newspaper-ink">Submit This Question</h4>
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
      </section>

      <section className="rounded-lg border border-newspaper-border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-newspaper-ink">Bubble Notes Board</h4>
            <p className="mt-1 text-xs text-newspaper-faded">
              Organize evidence bubbles before you connect them in the graph.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAIAutoCluster}
              disabled={isAIClustering}
              className="rounded-full border border-newspaper-ink bg-newspaper-ink px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-newspaper-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAIClustering ? 'Clustering...' : 'AI Auto Cluster'}
            </button>
            <button
              type="button"
              onClick={() => {
                taskEvidence.forEach((submission) => {
                  if (typeof submission.id === 'number') {
                    onAssignCluster(submission.id, inferClusterId(submission, activeTask));
                  }
                });
              }}
              className="rounded-full border border-newspaper-accent px-3 py-2 text-xs font-semibold text-newspaper-accent transition-colors hover:bg-newspaper-accent hover:text-white"
            >
              Auto Arrange
            </button>
            <button
              type="button"
              onClick={() => {
                taskEvidence.forEach((submission) => {
                  if (typeof submission.id === 'number' && submission.clusterId) {
                    onAssignCluster(submission.id, null);
                  }
                });
              }}
              className="rounded-full border border-newspaper-border px-3 py-2 text-xs font-semibold text-newspaper-faded transition-colors hover:border-newspaper-accent hover:text-newspaper-accent"
            >
              Reset Clusters
            </button>
          </div>
        </div>

        {aiClusterError ? (
          <p className="mt-3 text-sm text-red-700">{aiClusterError}</p>
        ) : null}

        <div className="mt-4 grid gap-4 xl:grid-cols-4">
          <NotesClusterColumn
            title="Unsorted"
            description="Fresh evidence that still needs interpretation."
            accentClass="border-slate-300 bg-slate-50 text-slate-900"
            items={taskEvidence.filter((submission) => !submission.clusterId)}
            highlights={highlights}
            onAssignCluster={onAssignCluster}
            onUpdateTags={onUpdateTags}
            allowReturn={false}
          />
          {CLUSTERS.map((cluster) => (
            <NotesClusterColumn
              key={cluster.id}
              title={cluster.title}
              description={cluster.description}
              accentClass={cluster.accentClass}
              items={taskEvidence.filter((submission) => submission.clusterId === cluster.id)}
              highlights={highlights}
              onAssignCluster={onAssignCluster}
              onUpdateTags={onUpdateTags}
              allowReturn
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-newspaper-border bg-white p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-newspaper-ink">Evidence Archive</h4>
          <span className="rounded-full bg-newspaper-aged px-2 py-1 text-xs text-newspaper-faded">
            {evidenceSubmissions.length} total
          </span>
        </div>

        {evidenceSubmissions.length === 0 ? (
          <p className="mt-3 text-sm text-newspaper-faded">No evidence has been submitted yet.</p>
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
      </section>
    </div>
  );
}

interface NotesClusterColumnProps {
  title: string;
  description: string;
  accentClass: string;
  items: EvidenceSubmission[];
  highlights: Highlight[];
  onAssignCluster: (submissionId: number, clusterId: EvidenceClusterId | null) => void;
  onUpdateTags: (submissionId: number, aiTags: string[]) => void;
  allowReturn: boolean;
}

function NotesClusterColumn({
  title,
  description,
  accentClass,
  items,
  highlights,
  onAssignCluster,
  onUpdateTags,
  allowReturn,
}: NotesClusterColumnProps) {
  return (
    <section className={`rounded-xl border p-4 shadow-sm ${accentClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h5 className="text-sm font-semibold">{title}</h5>
          <p className="mt-1 text-xs opacity-80">{description}</p>
        </div>
        <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm opacity-75">No evidence bubbles here yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((submission) => {
            const sourceHighlight = highlights.find((highlight) => highlight.id === submission.highlightId);
            return (
              <EvidenceBubble
                key={submission.id}
                submission={submission}
                sourceText={sourceHighlight?.text ?? null}
                onAssignCluster={onAssignCluster}
                onUpdateTags={onUpdateTags}
                allowReturn={allowReturn}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

interface EvidenceBubbleProps {
  submission: EvidenceSubmission;
  sourceText: string | null;
  onAssignCluster: (submissionId: number, clusterId: EvidenceClusterId | null) => void;
  onUpdateTags: (submissionId: number, aiTags: string[]) => void;
  allowReturn: boolean;
}

function EvidenceBubble({
  submission,
  sourceText,
  onAssignCluster,
  onUpdateTags,
  allowReturn,
}: EvidenceBubbleProps) {
  if (typeof submission.id !== 'number') {
    return null;
  }

  const [draftTags, setDraftTags] = useState<string[]>(submission.aiTags ?? []);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    setDraftTags(submission.aiTags ?? []);
    setTagInput('');
  }, [submission.aiTags]);

  const commitTagInput = () => {
    const normalized = tagInput.trim().toLowerCase();
    if (!normalized || draftTags.includes(normalized)) {
      setTagInput('');
      return;
    }

    setDraftTags((current) => [...current, normalized]);
    setTagInput('');
  };

  return (
    <div className="rounded-[28px] border border-newspaper-border bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
        {submission.evidenceType}
      </p>
      <p className="mt-2 text-sm text-newspaper-ink">{submission.note}</p>
      {sourceText ? (
        <p className="mt-2 line-clamp-2 text-xs text-newspaper-faded">Source: {sourceText}</p>
      ) : null}

      {draftTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {draftTags.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-label={`Remove tag ${tag} from bubble ${submission.id}`}
              onClick={() => setDraftTags((current) => current.filter((item) => item !== tag))}
              className="rounded-full bg-newspaper-aged px-2 py-1 text-[11px] font-medium text-newspaper-ink"
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
          Tags
          <input
            aria-label={`Bubble tags ${submission.id}`}
            type="text"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                commitTagInput();
                return;
              }

              if (event.key === 'Backspace' && tagInput.length === 0 && draftTags.length > 0) {
                setDraftTags((current) => current.slice(0, -1));
              }
            }}
            onBlur={commitTagInput}
            placeholder="Type a tag and press Enter"
            className="mt-1 w-full rounded-full border border-newspaper-border px-3 py-2 text-xs text-newspaper-ink outline-none transition-colors focus:border-newspaper-accent"
          />
        </label>
        <button
          type="button"
          aria-label={`Save Tags ${submission.id}`}
          onClick={() => onUpdateTags(submission.id!, draftTags)}
          className="rounded-full border border-newspaper-border px-3 py-1 text-xs font-medium text-newspaper-faded transition-colors hover:border-newspaper-accent hover:text-newspaper-accent"
        >
          Save Tags
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CLUSTERS.map((cluster) => (
          <button
            key={cluster.id}
            type="button"
            onClick={() => onAssignCluster(submission.id!, cluster.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              submission.clusterId === cluster.id
                ? 'border-newspaper-accent bg-newspaper-accent text-white'
                : 'border-newspaper-border bg-white text-newspaper-faded hover:border-newspaper-accent hover:text-newspaper-accent'
            }`}
          >
            {cluster.title}
          </button>
        ))}
        {allowReturn && submission.clusterId ? (
          <button
            type="button"
            onClick={() => onAssignCluster(submission.id!, null)}
            className="rounded-full border border-dashed border-newspaper-border px-3 py-1 text-xs font-medium text-newspaper-faded transition-colors hover:border-newspaper-accent hover:text-newspaper-accent"
          >
            Return to Unsorted
          </button>
        ) : null}
      </div>
    </div>
  );
}

function inferClusterId(
  submission: EvidenceSubmission,
  activeTask: InvestigationTask
): EvidenceClusterId {
  const combinedText = `${submission.note} ${submission.userInterpretation ?? ''}`.toLowerCase();

  const skepticismSignals = [
    'limit',
    'limitation',
    'only',
    'however',
    'fails',
    'failure',
    'weak',
    'narrow',
    'not generalize',
    'does not',
    'unclear',
    'missing',
    'bias',
  ];

  const supportSignals = [
    'improve',
    'gain',
    'outperform',
    'supports',
    'better',
    'strong',
    'significant',
    'demonstrate',
    'evidence',
  ];

  if (submission.evidenceType === 'limitation') {
    return 'needs-skepticism';
  }

  if (skepticismSignals.some((signal) => combinedText.includes(signal))) {
    return 'needs-skepticism';
  }

  if (
    submission.evidenceType === 'claim' ||
    submission.evidenceType === 'result' ||
    supportSignals.some((signal) => combinedText.includes(signal))
  ) {
    return 'supports-claim';
  }

  if (activeTask.section === 'discussion') {
    return 'needs-skepticism';
  }

  return 'open-thread';
}
