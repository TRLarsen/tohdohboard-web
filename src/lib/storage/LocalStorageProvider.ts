import { OmniBoardData, Task, Context } from '@/types';
import { StorageProvider } from './StorageProvider';

const STORAGE_KEY = 'omniboard-data';

const DEFAULT_DATA: OmniBoardData = {
  tasks: [],
  contexts: [
    { id: 'work', name: 'Work', order: 1 },
    { id: 'school', name: 'School', order: 2 },
    { id: 'projects', name: 'Projects', order: 3 }
  ]
};

export class LocalStorageProvider implements StorageProvider {
  async getData(): Promise<OmniBoardData> {
    if (typeof window === 'undefined') return DEFAULT_DATA;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_DATA;
    return JSON.parse(data);
  }

  async saveData(data: OmniBoardData): Promise<void> {
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
    // Optional: filter tasks for this context?
    data.tasks = data.tasks.filter(t => t.contextId !== contextId);
    await this.saveData(data);
  }
}

export const localStorageProvider = new LocalStorageProvider();
