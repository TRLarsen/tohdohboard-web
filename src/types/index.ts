export interface Column {
  id: string;
  name: string;
  position: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string; // maps to Column.id
  contextId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Context {
  id: string;
  name: string;
  position: number;
}

export interface TohdohBoardData {
  tasks: Task[];
  contexts: Context[];
  columns: Column[];
}
