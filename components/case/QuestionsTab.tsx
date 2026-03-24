'use client';

import type { InvestigationTask } from '@/types';

interface QuestionsTabProps {
  tasks: InvestigationTask[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

const TASK_STATUS_LABELS: Record<InvestigationTask['status'], string> = {
  locked: 'Locked',
  available: 'Available',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const TASK_STATUS_STYLES: Record<InvestigationTask['status'], string> = {
  locked: 'bg-gray-200 text-gray-700',
  available: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

export function QuestionsTab({ tasks, activeTaskId, onSelectTask }: QuestionsTabProps) {
  if (tasks.length === 0) {
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
          Scroll through all generated questions and switch the active investigation target at any time.
        </p>
        <p className="mt-2 text-xs text-newspaper-faded">
          {tasks.length} question{tasks.length === 1 ? '' : 's'} available
        </p>
      </div>

      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {tasks.map((task) => {
          const isActive = task.id === activeTaskId;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelectTask(task.id)}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                isActive
                  ? 'border-newspaper-accent bg-white shadow-sm'
                  : 'border-newspaper-border bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-newspaper-ink">{task.title}</p>
                  <p className="mt-1 text-sm text-newspaper-faded">{task.question}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${TASK_STATUS_STYLES[task.status]}`}>
                  {TASK_STATUS_LABELS[task.status]}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-newspaper-faded">
                <p>
                  <span className="font-semibold text-newspaper-ink">Where to look:</span>{' '}
                  {task.whereToLook.join(' / ')}
                </p>
                <p>
                  <span className="font-semibold text-newspaper-ink">What to collect:</span>{' '}
                  {task.whatToFind}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
