import { Task, Context, Column, TohdohBoardData, ArchivedTask } from '@/types';

export interface StorageProvider {
  getData(): Promise<TohdohBoardData>;
  saveData(data: TohdohBoardData): Promise<void>;
  
  getTasks(): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  
  getSwimlanes(): Promise<Context[]>;
  saveSwimlane(context: Context): Promise<void>;
  deleteSwimlane(contextId: string): Promise<void>;
  updateSwimlaneOrder(laneIds: string[]): Promise<void>;
  
  getColumns(): Promise<Column[]>;
  saveColumn(column: Column): Promise<void>;
  deleteColumn(columnId: string): Promise<void>;
  updateColumnOrder(columnIds: string[]): Promise<void>;

  /** Archived tasks, newest first. */
  getArchive(): Promise<ArchivedTask[]>;
  /** Moves tasks from the board to the archive; returns how many were archived. */
  archiveTasks(taskIds: string[]): Promise<number>;
  /** Moves archived tasks back onto the board; returns how many were restored. */
  restoreTasks(taskIds: string[]): Promise<number>;
}
