'use client';

import type { InvestigationTask } from '@/types';

interface TaskCardProps {
  task: InvestigationTask;
  isActive?: boolean;
}

export function TaskCard({ task, isActive = false }: TaskCardProps) {
  return (
    <article
      className={`rounded-lg border p-4 ${
        isActive ? 'border-newspaper-ink bg-newspaper-cream' : 'border-newspaper-border bg-white'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-newspaper-ink">{task.title}</h3>
          <span className="text-xs uppercase tracking-wide text-newspaper-faded">
            Status: {task.status}
          </span>
        </div>
        <p className="text-sm text-newspaper-faded">{task.question}</p>
        <p className="text-sm text-newspaper-faded">{task.narrativeHook}</p>
        <p className="text-xs text-newspaper-faded">
          Sections: {task.linkedStructureKinds.join(', ')}
        </p>
      </div>
    </article>
  );
}
