'use client';

import { useEffect, useState } from 'react';

import type { EvidenceType, Highlight, InvestigationTask } from '@/types';

interface EvidenceSubmitModalProps {
  highlight: Highlight | null;
  tasks: InvestigationTask[];
  activeTaskId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskId: string, evidenceType: EvidenceType, note: string) => Promise<void> | void;
}

const EVIDENCE_TYPES: EvidenceType[] = ['claim', 'comparison', 'method', 'result', 'limitation'];

export function EvidenceSubmitModal({
  highlight,
  tasks,
  activeTaskId = null,
  isOpen,
  onClose,
  onSubmit,
}: EvidenceSubmitModalProps) {
  const availableTasks = tasks.filter((task) => task.status !== 'locked');
  const [taskId, setTaskId] = useState(activeTaskId ?? availableTasks[0]?.id ?? '');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('claim');
  const [note, setNote] = useState('');
  const selectedTask =
    availableTasks.find((task) => task.id === taskId) ??
    availableTasks.find((task) => task.id === activeTaskId) ??
    availableTasks[0] ??
    null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const preferredTaskId =
      (activeTaskId && availableTasks.some((task) => task.id === activeTaskId) ? activeTaskId : null) ??
      availableTasks[0]?.id ??
      '';

    setTaskId(preferredTaskId);
  }, [activeTaskId, availableTasks, isOpen]);

  if (!isOpen || !highlight) {
    return null;
  }

  const handleSubmit = async () => {
    if (!taskId) {
      return;
    }

    await onSubmit(taskId, evidenceType, note.trim() || highlight.text);
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-newspaper-ink">Submit Evidence</h2>
        <p className="mt-2 text-sm text-newspaper-faded">{highlight.text}</p>

        <label className="mt-4 block text-sm font-medium text-newspaper-ink">
          Task
          <select
            className="mt-1 w-full rounded border border-newspaper-border p-2"
            value={taskId}
            onChange={(event) => setTaskId(event.target.value)}
            aria-label="Task"
          >
            {availableTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </label>

        {selectedTask ? (
          <div className="mt-3 rounded border border-newspaper-border bg-newspaper-cream p-3 text-xs text-newspaper-faded">
            <p className="font-semibold text-newspaper-ink">{selectedTask.question}</p>
            <p className="mt-1">
              <span className="font-semibold text-newspaper-ink">Where to look:</span>{' '}
              {selectedTask.linkedStructureKinds.join(' / ')}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-newspaper-ink">Completion rule:</span>{' '}
              At least {selectedTask.minEvidenceCount} evidence item{selectedTask.minEvidenceCount > 1 ? 's' : ''}, covering{' '}
              {selectedTask.requiredEvidenceTypes.join(', ')}.
            </p>
          </div>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-newspaper-ink">
          Evidence Type
          <select
            className="mt-1 w-full rounded border border-newspaper-border p-2"
            value={evidenceType}
            onChange={(event) => setEvidenceType(event.target.value as EvidenceType)}
          >
            {EVIDENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm font-medium text-newspaper-ink">
          Note
          <textarea
            className="mt-1 min-h-24 w-full rounded border border-newspaper-border p-2"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional. Leave blank to use the highlighted sentence."
          />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="rounded border px-4 py-2 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="rounded bg-newspaper-ink px-4 py-2 text-sm text-white" onClick={() => void handleSubmit()}>
            Save Evidence
          </button>
        </div>
      </div>
    </div>
  );
}
