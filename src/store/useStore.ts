import { create } from 'zustand';
import { Task, Context, TaskStatus } from '@/types';
import { localStorageProvider } from '@/lib/storage/LocalStorageProvider';
import { v4 as uuidv4 } from 'uuid';

interface BoardState {
  tasks: Task[];
  contexts: Context[];
  loading: boolean;
  
  // Actions
  loadData: () => Promise<void>;
  addTask: (title: string, description: string, status: TaskStatus, contextId: string) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, status: TaskStatus, contextId: string) => Promise<void>;
  
  addContext: (name: string) => Promise<void>;
  updateContext: (context: Context) => Promise<void>;
  deleteContext: (contextId: string) => Promise<void>;
}

export const useStore = create<BoardState>((set, get) => ({
  tasks: [],
  contexts: [],
  loading: true,

  loadData: async () => {
    set({ loading: true });
    const data = await localStorageProvider.getData();
    set({ tasks: data.tasks, contexts: data.contexts, loading: false });
  },

  addTask: async (title, description, status, contextId) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      description,
      status,
      contextId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedTasks = [...get().tasks, newTask];
    set({ tasks: updatedTasks });
    await localStorageProvider.saveData({ tasks: updatedTasks, contexts: get().contexts });
  },

  updateTask: async (task) => {
    const updatedTask = { ...task, updatedAt: new Date().toISOString() };
    const updatedTasks = get().tasks.map(t => t.id === task.id ? updatedTask : t);
    set({ tasks: updatedTasks });
    await localStorageProvider.saveData({ tasks: updatedTasks, contexts: get().contexts });
  },

  deleteTask: async (taskId) => {
    const updatedTasks = get().tasks.filter(t => t.id !== taskId);
    set({ tasks: updatedTasks });
    await localStorageProvider.saveData({ tasks: updatedTasks, contexts: get().contexts });
  },

  moveTask: async (taskId, status, contextId) => {
    const updatedTasks = get().tasks.map(t => 
      t.id === taskId ? { ...t, status, contextId, updatedAt: new Date().toISOString() } : t
    );
    set({ tasks: updatedTasks });
    await localStorageProvider.saveData({ tasks: updatedTasks, contexts: get().contexts });
  },

  addContext: async (name) => {
    const newContext: Context = {
      id: uuidv4(),
      name,
      order: get().contexts.length + 1,
    };
    
    const updatedContexts = [...get().contexts, newContext];
    set({ contexts: updatedContexts });
    await localStorageProvider.saveData({ tasks: get().tasks, contexts: updatedContexts });
  },

  updateContext: async (context) => {
    const updatedContexts = get().contexts.map(c => c.id === context.id ? context : c);
    set({ contexts: updatedContexts });
    await localStorageProvider.saveData({ tasks: get().tasks, contexts: updatedContexts });
  },

  deleteContext: async (contextId) => {
    const updatedContexts = get().contexts.filter(c => c.id !== contextId);
    const updatedTasks = get().tasks.filter(t => t.contextId !== contextId);
    set({ contexts: updatedContexts, tasks: updatedTasks });
    await localStorageProvider.saveData({ tasks: updatedTasks, contexts: updatedContexts });
  },
}));
