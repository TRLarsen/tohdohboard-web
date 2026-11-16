import { TohdohBoardData, Task, Context, Column, ArchivedTask } from '@/types';
import { StorageProvider } from './StorageProvider';

// Absolute API base for builds without the Next server (static export / native shell); otherwise
// same-origin `/api`, which next.config.ts rewrites to the backend.
const API_BASE = (process.env.NEXT_PUBLIC_TOHDOH_API_URL || '/api').replace(/\/+$/, '');
const TOKEN_KEY = 'tohdohboard-token';

/** The backend answered 401 asking for a bearer token: it is missing or was rejected. */
export class UnauthorizedError extends Error {}

export function getAccessToken(): string | null {
  try {
    return typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Stores the bearer token sent with every API request; `null` forgets it. */
export function setAccessToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable: the token can't be remembered.
  }
}

export class HttpStorageProvider implements StorageProvider {
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (init.body) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${API_BASE}${path}`, { cache: 'no-store', ...init, headers });
    if (response.status === 401) {
      // The backend challenges for a bearer token only where one would be accepted. Otherwise
      // (proxy auth) the proxy in front of it did not identify the user: a token can't help.
      if (/^bearer\b/i.test(response.headers.get('WWW-Authenticate') ?? '')) {
        throw new UnauthorizedError('Access token required');
      }
      throw new Error('Not signed in: open the board through its sign-in proxy (e.g. Tailscale Serve)');
    }
    if (!response.ok) {
      throw new Error(`${init.method ?? 'GET'} ${path} failed: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private postJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  async getData(): Promise<TohdohBoardData> {
    return this.request<TohdohBoardData>('/data');
  }

  async saveData(data: TohdohBoardData): Promise<void> {
    await this.request('/data', { method: 'PUT', body: JSON.stringify(data) });
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

  async getArchive(): Promise<ArchivedTask[]> {
    return (await this.request<{ tasks: ArchivedTask[] }>('/archive')).tasks;
  }

  async archiveTasks(taskIds: string[]): Promise<number> {
    return (await this.postJson<{ archived: number }>('/archive', { taskIds })).archived;
  }

  async restoreTasks(taskIds: string[]): Promise<number> {
    return (await this.postJson<{ restored: number }>('/archive/restore', { taskIds })).restored;
  }
}

export const httpStorageProvider = new HttpStorageProvider();
