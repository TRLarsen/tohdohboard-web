import { TohdohBoardData, Task, Context, Column, ArchivedTask } from '@/types';
import { StorageProvider } from './StorageProvider';
import { unarchiveTask } from '@/lib/board';

const STORAGE_KEY = 'tohdohboard-data';
const ARCHIVE_KEY = 'tohdohboard-archive';

const DEFAULT_DATA: TohdohBoardData = {
  tasks: [],
  contexts: [
    { id: 'work', name: 'Work', position: 1 },
    { id: 'school', name: 'School', position: 2 },
    { id: 'projects', name: 'Projects', position: 3 }
  ],
  columns: [
    { id: 'todo', name: 'To Do', position: 1 },
    { id: 'doing', name: 'Doing', position: 2 },
    { id: 'done', name: 'Done', position: 3 }
  ]
};

export class LocalStorageProvider implements StorageProvider {
  async getData(): Promise<TohdohBoardData> {
    if (typeof window === 'undefined') return DEFAULT_DATA;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_DATA;
    return JSON.parse(data);
  }

  async saveData(data: TohdohBoardData): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async getTasks(): Promise<Task[]> {
    const data = await this.getData();
    return data.tasks;
  }

  async saveTask(task: Task): Promise<void> {
    const data = await this.getData();
    const index = data.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      data.tasks[index] = task;
    } else {
      data.tasks.push(task);
    }
    await this.saveData(data);
  }

  async deleteTask(taskId: string): Promise<void> {
    const data = await this.getData();
    data.tasks = data.tasks.filter(t => t.id !== taskId);
    await this.saveData(data);
  }

  async getSwimlanes(): Promise<Context[]> {
    const data = await this.getData();
    return data.contexts;
  }

  async saveSwimlane(context: Context): Promise<void> {
    const data = await this.getData();
    const index = data.contexts.findIndex(c => c.id === context.id);
    if (index !== -1) {
      data.contexts[index] = context;
    } else {
      data.contexts.push(context);
    }
    await this.saveData(data);
  }

  async deleteSwimlane(contextId: string): Promise<void> {
    const data = await this.getData();
    data.contexts = data.contexts.filter(c => c.id !== contextId);
    data.tasks = data.tasks.filter(t => t.contextId !== contextId);
    await this.saveData(data);
  }

  async updateSwimlaneOrder(laneIds: string[]): Promise<void> {
    const data = await this.getData();
    data.contexts = data.contexts.map(c => {
      const position = laneIds.indexOf(c.id);
      return position !== -1 ? { ...c, position } : c;
    });
    await this.saveData(data);
  }

  async getColumns(): Promise<Column[]> {
    const data = await this.getData();
    return data.columns;
  }

  async saveColumn(column: Column): Promise<void> {
    const data = await this.getData();
    const index = data.columns.findIndex(c => c.id === column.id);
    if (index !== -1) {
      data.columns[index] = column;
    } else {
      data.columns.push(column);
    }
    await this.saveData(data);
  }

  async deleteColumn(columnId: string): Promise<void> {
    const data = await this.getData();
    data.columns = data.columns.filter(c => c.id !== columnId);
    data.tasks = data.tasks.filter(t => t.status !== columnId);
    await this.saveData(data);
  }

  async updateColumnOrder(columnIds: string[]): Promise<void> {
    const data = await this.getData();
    data.columns = data.columns.map(c => {
      const position = columnIds.indexOf(c.id);
      return position !== -1 ? { ...c, position } : c;
    });
    await this.saveData(data);
  }

  async getArchive(): Promise<ArchivedTask[]> {
    if (typeof window === 'undefined') return [];
    const archive: ArchivedTask[] = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
    return archive.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));
  }

  async archiveTasks(taskIds: string[]): Promise<number> {
    const data = await this.getData();
    const archivedAt = new Date().toISOString();
    const moved = data.tasks.filter(t => taskIds.includes(t.id)).map(t => ({ ...t, archivedAt }));
    data.tasks = data.tasks.filter(t => !taskIds.includes(t.id));
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...(await this.getArchive()), ...moved]));
    await this.saveData(data);
    return moved.length;
  }

  async restoreTasks(taskIds: string[]): Promise<number> {
    const archive = await this.getArchive();
    const data = await this.getData();
    const updatedAt = new Date().toISOString();
    const restored = archive
      .filter(t => taskIds.includes(t.id))
      .map(t => unarchiveTask(t, updatedAt));
    data.tasks.push(...restored);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive.filter(t => !taskIds.includes(t.id))));
    await this.saveData(data);
    return restored.length;
  }
}

export const localStorageProvider = new LocalStorageProvider();
