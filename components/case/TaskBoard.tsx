'use client';

import type { InvestigationTask } from '@/types';

import { TaskCard } from './TaskCard';

interface TaskBoardProps {
  tasks: InvestigationTask[];
  activeTaskId?: string | null;
}

export function TaskBoard({ tasks, activeTaskId = null }: TaskBoardProps) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-newspaper-faded">
          Investigation Tasks
        </p>
      </div>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} isActive={task.id === activeTaskId} />
      ))}
    </section>
  );
}
