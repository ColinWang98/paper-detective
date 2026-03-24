import type { EvidenceSubmission, InvestigationTask } from '@/types';

export const FINAL_REPORT_QUESTION_THRESHOLD = 10;

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

export function getCompletedQuestionCount(tasks: InvestigationTask[]): number {
  return tasks.filter((task) => task.status === 'completed').length;
}

export function getFinalReportUnlockThreshold(tasks: InvestigationTask[]): number {
  if (tasks.length === 0) {
    return FINAL_REPORT_QUESTION_THRESHOLD;
  }

  return Math.min(FINAL_REPORT_QUESTION_THRESHOLD, tasks.length);
}

export function isFinalReportUnlocked(tasks: InvestigationTask[]): boolean {
  return getCompletedQuestionCount(tasks) >= getFinalReportUnlockThreshold(tasks);
}
