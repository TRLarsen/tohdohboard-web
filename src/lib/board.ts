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

const pad = (n: number) => String(n).padStart(2, '0');

/** Today as "YYYY-MM-DD" in the local time zone (due dates are calendar dates, not instants). */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Short label for a "YYYY-MM-DD" due date, built from local date parts so it never shifts a day. */
export function formatDueDate(dueDate: string): string {
  const [y, m, d] = dueDate.split('-').map(Number);
  const sameYear = y === new Date().getFullYear();
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** A copy of the task with `dueDate` set, or with the key removed when it is empty. */
export function withDueDate(task: Task, dueDate: string | undefined): Task {
  const updated = { ...task, dueDate };
  if (!dueDate) delete updated.dueDate;
  return updated;
}
