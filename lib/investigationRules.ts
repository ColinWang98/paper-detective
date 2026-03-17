import type { EvidenceSubmission, InvestigationTask } from '@/types';

export function evaluateTaskProgress(
  tasks: InvestigationTask[],
  evidenceSubmissions: EvidenceSubmission[]
): InvestigationTask[] {
  const updatedTasks = tasks.map((task) => ({ ...task }));

  for (const task of updatedTasks) {
    const taskEvidence = evidenceSubmissions.filter((submission) => submission.taskId === task.id);
    const hasMinimumEvidence = taskEvidence.length >= task.minEvidenceCount;
    const hasRequiredTypes = task.requiredEvidenceTypes.every((requiredType) =>
      taskEvidence.some((submission) => submission.evidenceType === requiredType)
    );

    if (hasMinimumEvidence && hasRequiredTypes) {
      task.status = 'completed';

      for (const unlockedTaskId of task.unlocksTaskIds) {
        const unlockedTask = updatedTasks.find((candidate) => candidate.id === unlockedTaskId);
        if (unlockedTask && unlockedTask.status === 'locked') {
          unlockedTask.status = 'available';
        }
      }
    }
  }

  return updatedTasks;
}
