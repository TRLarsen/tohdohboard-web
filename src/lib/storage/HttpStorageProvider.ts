import { TohdohBoardData, Task, Context, Column } from '@/types';
import { StorageProvider } from './StorageProvider';

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3001/api/data`;
  }
  return 'http://127.0.0.1:3001/api/data';
};

const API_URL = getApiUrl();

const DEFAULT_DATA: TohdohBoardData = {
  tasks: [],
  contexts: [],
  columns: []
};

export class HttpStorageProvider implements StorageProvider {
  async getData(): Promise<TohdohBoardData> {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching from backend:', error);
      return DEFAULT_DATA;
    }
  }

  async saveData(data: TohdohBoardData): Promise<void> {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
    }
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
    try {
      const data = await this.getData();
      const updatedContexts = data.contexts.map(c => {
        const index = laneIds.indexOf(c.id);
        return { ...c, position: index !== -1 ? index : c.position };
      });
      await this.saveData({ ...data, contexts: updatedContexts });
    } catch (error) {
      console.error('Failed to update swimlane order:', error);
    }
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
    try {
      const data = await this.getData();
      const updatedColumns = data.columns.map(c => {
        const index = columnIds.indexOf(c.id);
        return { ...c, position: index !== -1 ? index : c.position };
      });
      await this.saveData({ ...data, columns: updatedColumns });
    } catch (error) {
      console.error('Failed to update column order:', error);
    }
  }
}

export const httpStorageProvider = new HttpStorageProvider();
