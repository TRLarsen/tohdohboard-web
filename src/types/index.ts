export type TaskStatus = 'To Do' | 'Doing' | 'High Priority' | 'Done' | 'Blocked';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  contextId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Context {
  id: string;
  name: string;
  order: number;
}

export interface OmniBoardData {
  tasks: Task[];
  contexts: Context[];
}
