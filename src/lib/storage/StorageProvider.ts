import { Task, Context, OmniBoardData } from '@/types';

export interface StorageProvider {
  getData(): Promise<OmniBoardData>;
  saveData(data: OmniBoardData): Promise<void>;
  
  // Specific methods mentioned in requirements
  getTasks(): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  getSwimlanes(): Promise<Context[]>;
  saveSwimlane(context: Context): Promise<void>;
  deleteSwimlane(contextId: string): Promise<void>;
}
