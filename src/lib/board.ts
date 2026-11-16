import { ArchivedTask, Column, Task } from '@/types';

/** The backend's default `archive.done_column`. */
const DEFAULT_DONE_COLUMN = 'done';

/**
 * The column treated as "done": the one with id `done`, if any. That is the column the backend
 * auto-archives by default; its configured done column is not exposed to the web app.
 */
export function doneColumnId(columns: Column[]): string | undefined {
  return columns.some(c => c.id === DEFAULT_DONE_COLUMN) ? DEFAULT_DONE_COLUMN : undefined;
}

/** The board task for an archived one (as the backend restores it: `updatedAt` bumped, other fields kept). */
export function unarchiveTask(task: ArchivedTask, updatedAt: string): Task {
  const restored: Partial<ArchivedTask> = { ...task, updatedAt };
  delete restored.archivedAt;
  return restored as Task;
}
