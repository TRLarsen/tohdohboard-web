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

/** A task moved off the board by the backend's archive (manually or by the done-column sweep). */
export interface ArchivedTask extends Task {
  archivedAt: string;
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
