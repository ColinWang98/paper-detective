'use client';

import type { InvestigationTask } from '@/types';

interface ProgressTabProps {
  tasks: InvestigationTask[];
}

export function ProgressTab({ tasks }: ProgressTabProps) {
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const available = tasks.filter((task) => task.status === 'available' || task.status === 'in_progress').length;
  const locked = tasks.filter((task) => task.status === 'locked').length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-newspaper-border bg-white p-4">
        <h3 className="text-sm font-semibold text-newspaper-ink">Completed questions</h3>
        <p className="mt-2 text-3xl font-bold text-newspaper-ink">
          {completed}
          <span className="ml-2 text-sm font-medium text-newspaper-faded">/ {tasks.length}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-newspaper-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-newspaper-faded">
            Ready now
          </p>
          <p className="mt-2 text-2xl font-bold text-newspaper-ink">{available}</p>
        </div>
        <div className="rounded-lg border border-newspaper-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-newspaper-faded">
            Still locked
          </p>
          <p className="mt-2 text-2xl font-bold text-newspaper-ink">{locked}</p>
        </div>
      </div>

      <div className="rounded-lg border border-newspaper-border bg-white p-4">
        <h3 className="text-sm font-semibold text-newspaper-ink">Unlock status</h3>
        <p className="mt-2 text-sm text-newspaper-faded">
          {locked === 0
            ? 'All questions are unlocked. You can continue gathering evidence or move toward final evaluation.'
            : 'More questions will unlock as you complete the currently available investigation work.'}
        </p>
      </div>
    </div>
  );
}
