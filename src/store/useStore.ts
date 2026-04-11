import { create } from 'zustand';
import { Task, Context, Column, TohdohBoardData } from '@/types';
import { httpStorageProvider as storageProvider } from '@/lib/storage/HttpStorageProvider';
import { v4 as uuidv4 } from 'uuid';

interface BoardState {
  tasks: Task[];
  contexts: Context[];
  columns: Column[];
  loading: boolean;
  editMode: boolean;
  
  // Actions
  setEditMode: (editMode: boolean) => void;
  loadData: () => Promise<void>;
  addTask: (title: string, description: string, status: string, contextId: string) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, status: string, contextId: string) => Promise<void>;
  
  addContext: (name: string) => Promise<void>;
  updateContext: (context: Context) => Promise<void>;
  deleteContext: (contextId: string) => Promise<void>;
  updateSwimlaneOrder: (laneIds: string[]) => Promise<void>;

  addColumn: (name: string) => Promise<void>;
  updateColumn: (column: Column) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  updateColumnOrder: (columnIds: string[]) => Promise<void>;
}

export const useStore = create<BoardState>((set, get) => ({
  tasks: [],
  contexts: [],
  columns: [],
  loading: true,
  editMode: false,

  setEditMode: (editMode) => set({ editMode }),

  loadData: async () => {
    set({ loading: true });
    try {
      const data = await storageProvider.getData();
      set({ 
        tasks: data.tasks, 
        contexts: data.contexts.sort((a, b) => a.position - b.position), 
        columns: data.columns.sort((a, b) => a.position - b.position), 
        loading: false 
      });
    } catch (error) {
      console.error('Failed to load data from server, falling back to empty state', error);
      set({ loading: false });
    }
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
    await storageProvider.saveData({ 
      tasks: updatedTasks, 
      contexts: get().contexts, 
      columns: get().columns 
    });
  },

  updateTask: async (task) => {
    const updatedTask = { ...task, updatedAt: new Date().toISOString() };
    const updatedTasks = get().tasks.map(t => t.id === task.id ? updatedTask : t);
    set({ tasks: updatedTasks });
    await storageProvider.saveData({ 
      tasks: updatedTasks, 
      contexts: get().contexts, 
      columns: get().columns 
    });
  },

  deleteTask: async (taskId) => {
    const updatedTasks = get().tasks.filter(t => t.id !== taskId);
    set({ tasks: updatedTasks });
    await storageProvider.saveData({ 
      tasks: updatedTasks, 
      contexts: get().contexts, 
      columns: get().columns 
    });
  },

  moveTask: async (taskId, status, contextId) => {
    const updatedTasks = get().tasks.map(t => 
      t.id === taskId ? { ...t, status, contextId, updatedAt: new Date().toISOString() } : t
    );
    set({ tasks: updatedTasks });
    await storageProvider.saveData({ 
      tasks: updatedTasks, 
      contexts: get().contexts, 
      columns: get().columns 
    });
  },

  addContext: async (name) => {
    const id = name.toLowerCase().trim().replace(/\s+/g, '-');
    if (get().contexts.find(c => c.id === id)) {
      console.error(`Context with ID "${id}" already exists.`);
      return;
    }

    const newContext: Context = {
      id,
      name,
      position: get().contexts.length,
    };
    
    const updatedContexts = [...get().contexts, newContext].sort((a, b) => a.position - b.position);
    set({ contexts: updatedContexts });
    await storageProvider.saveData({ 
      tasks: get().tasks, 
      contexts: updatedContexts, 
      columns: get().columns 
    });
  },

  updateContext: async (context) => {
    const updatedContexts = get().contexts.map(c => c.id === context.id ? context : c).sort((a, b) => a.position - b.position);
    set({ contexts: updatedContexts });
    await storageProvider.saveData({ 
      tasks: get().tasks, 
      contexts: updatedContexts, 
      columns: get().columns 
    });
  },

  deleteContext: async (contextId) => {
    const updatedContexts = get().contexts.filter(c => c.id !== contextId);
    const updatedTasks = get().tasks.filter(t => t.contextId !== contextId);
    set({ contexts: updatedContexts, tasks: updatedTasks });
    await storageProvider.saveData({ 
      tasks: updatedTasks, 
      contexts: updatedContexts, 
      columns: get().columns 
    });
  },

  updateSwimlaneOrder: async (laneIds) => {
    await storageProvider.updateSwimlaneOrder(laneIds);
    const data = await storageProvider.getData();
    set({ contexts: data.contexts.sort((a, b) => a.position - b.position) });
  },

  addColumn: async (name) => {
    const id = name.toLowerCase().trim().replace(/\s+/g, '-');
    if (get().columns.find(c => c.id === id)) {
      console.error(`Column with ID "${id}" already exists.`);
      return;
    }

    const newColumn: Column = {
      id,
      name,
      position: get().columns.length,
    };
    
    const updatedColumns = [...get().columns, newColumn].sort((a, b) => a.position - b.position);
    set({ columns: updatedColumns });
    await storageProvider.saveData({ 
      tasks: get().tasks, 
      contexts: get().contexts, 
      columns: updatedColumns 
    });
  },

  updateColumn: async (column) => {
    const updatedColumns = get().columns.map(c => c.id === column.id ? column : c).sort((a, b) => a.position - b.position);
    set({ columns: updatedColumns });
    await storageProvider.saveData({ 
      tasks: get().tasks, 
      contexts: get().contexts, 
      columns: updatedColumns 
    });
  },

  deleteColumn: async (columnId) => {
    const updatedColumns = get().columns.filter(c => c.id !== columnId);
    set({ columns: updatedColumns });
    await storageProvider.saveData({ 
      tasks: get().tasks, 
      contexts: get().contexts, 
      columns: updatedColumns 
    });
  },

  updateColumnOrder: async (columnIds) => {
    await storageProvider.updateColumnOrder(columnIds);
    const data = await storageProvider.getData();
    set({ columns: data.columns.sort((a, b) => a.position - b.position) });
  },
}));
