import { create } from 'zustand';
import { Task, Context, Column, ArchivedTask, TohdohBoardData } from '@/types';
import {
  httpStorageProvider as storageProvider,
  UnauthorizedError,
  getAccessToken,
  setAccessToken,
} from '@/lib/storage/HttpStorageProvider';
import { unarchiveTask } from '@/lib/board';
import { v4 as uuidv4 } from 'uuid';

// Which swimlanes are collapsed is a per-device view preference, so it lives in localStorage
// rather than in the shared board document.
const COLLAPSED_LANES_KEY = 'tohdohboard-collapsed-lanes';

function readCollapsedLanes(): string[] {
  try {
    return typeof window === 'undefined' ? [] : JSON.parse(localStorage.getItem(COLLAPSED_LANES_KEY) || '[]');
  } catch {
    return [];
  }
}

// Writes reach the server one at a time, in order: every mutation PUTs the whole document, so an
// older PUT landing after a newer one would undo it, and archive/restore must not overlap a PUT
// (a task has to exist on the server before it can be archived).
let writeQueue: Promise<unknown> = Promise.resolve();
let pendingWrites = 0; // queued or running
let writesQueued = 0; // ever; lets a refresh notice writes that started while it was fetching
let queuedSave: Promise<void> | null = null; // a save that has not started yet

function enqueueWrite<T>(write: () => Promise<T>): Promise<T> {
  pendingWrites++;
  writesQueued++;
  const run = writeQueue.then(write).finally(() => pendingWrites--);
  writeQueue = run.catch(() => {});
  return run;
}

// The document as last loaded, so saves keep top-level fields this app doesn't know about.
let loadedDoc: Partial<TohdohBoardData> = {};

const boardState = (data: TohdohBoardData) => {
  loadedDoc = data;
  return {
    tasks: data.tasks,
    contexts: data.contexts.sort((a, b) => a.position - b.position),
    columns: data.columns.sort((a, b) => a.position - b.position),
  };
};

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));
const needsTokenIf = (error: unknown) => (error instanceof UnauthorizedError ? { needsToken: true } : {});

interface BoardState {
  tasks: Task[];
  contexts: Context[];
  columns: Column[];
  loading: boolean;
  /** True once the board was loaded from the server; saving is refused until then. */
  loaded: boolean;
  loadError: string | null;
  saveError: string | null;
  /** The server answered 401 and accepts a bearer token: ask the user for one. */
  needsToken: boolean;
  hasToken: boolean;
  editMode: boolean;
  collapsedLanes: string[];
  archivedTasks: ArchivedTask[] | null; // null while (re)loading or after an error
  archiveError: string | null;
  archiveOpen: boolean;
  
  // Actions
  setEditMode: (editMode: boolean) => void;
  loadData: () => Promise<void>;
  refresh: () => Promise<void>;
  save: () => Promise<void>;
  submitToken: (token: string) => void;
  forgetToken: () => void;
  dismissTokenPrompt: () => void;
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

  toggleLaneCollapsed: (contextId: string) => void;
  setArchiveOpen: (open: boolean) => void;
  loadArchive: () => Promise<void>;
  archiveTasks: (taskIds: string[]) => Promise<void>;
  restoreTasks: (taskIds: string[]) => Promise<void>;
}

export const useStore = create<BoardState>((set, get) => ({
  tasks: [],
  contexts: [],
  columns: [],
  loading: true,
  loaded: false,
  loadError: null,
  saveError: null,
  needsToken: false,
  hasToken: getAccessToken() !== null,
  editMode: false,
  collapsedLanes: readCollapsedLanes(),
  archivedTasks: null,
  archiveError: null,
  archiveOpen: false,

  setEditMode: (editMode) => set({ editMode }),

  loadData: async () => {
    set({ loading: true, loadError: null });
    try {
      const data = await storageProvider.getData();
      set({ ...boardState(data), loading: false, loaded: true });
    } catch (error) {
      console.error('Failed to load data from server', error);
      set({ loading: false, loadError: errorMessage(error), ...needsTokenIf(error) });
    }
  },

  // Picks up changes made elsewhere (another device, the server's auto-archive). Skipped while
  // local changes are on their way, and dropped if one started meanwhile, so it never undoes them.
  refresh: async () => {
    if (get().loading || !get().loaded || pendingWrites) return;
    const writesBefore = writesQueued;
    try {
      const data = await storageProvider.getData();
      if (writesQueued === writesBefore) set(boardState(data));
    } catch (error) {
      console.error('Failed to refresh the board', error);
    }
    if (get().archiveOpen) get().loadArchive();
  },

  // A save that has not started yet sends the state as it is when it starts, so changes made
  // meanwhile join it instead of queueing another PUT. Every save PUTs the whole document, so
  // never save a board we failed to load: that would overwrite the real data with an empty one.
  save: () => {
    queuedSave ??= enqueueWrite(async () => {
      queuedSave = null;
      if (!get().loaded) return;
      const { tasks, contexts, columns } = get();
      try {
        await storageProvider.saveData({ ...loadedDoc, tasks, contexts, columns });
        set({ saveError: null });
      } catch (error) {
        console.error('Failed to save data', error);
        set({ saveError: errorMessage(error), ...needsTokenIf(error) });
      }
    });
    return queuedSave;
  },

  submitToken: (token) => {
    setAccessToken(token);
    set({ hasToken: true, needsToken: false });
    // Retry whatever needed the token.
    if (!get().loaded) {
      get().loadData();
      return;
    }
    if (get().saveError) get().save();
    if (get().archiveOpen) get().loadArchive();
  },

  forgetToken: () => {
    setAccessToken(null);
    set({ hasToken: false, loaded: false, tasks: [], contexts: [], columns: [], archivedTasks: null });
    get().loadData();
  },

  dismissTokenPrompt: () => set({ needsToken: false }),

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
    await get().save();
  },

  updateTask: async (task) => {
    const updatedTask = { ...task, updatedAt: new Date().toISOString() };
    const updatedTasks = get().tasks.map(t => t.id === task.id ? updatedTask : t);
    set({ tasks: updatedTasks });
    await get().save();
  },

  deleteTask: async (taskId) => {
    const updatedTasks = get().tasks.filter(t => t.id !== taskId);
    set({ tasks: updatedTasks });
    await get().save();
  },

  moveTask: async (taskId, status, contextId) => {
    const updatedTasks = get().tasks.map(t => 
      t.id === taskId ? { ...t, status, contextId, updatedAt: new Date().toISOString() } : t
    );
    set({ tasks: updatedTasks });
    await get().save();
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
    await get().save();
  },

  updateContext: async (context) => {
    const updatedContexts = get().contexts.map(c => c.id === context.id ? context : c).sort((a, b) => a.position - b.position);
    set({ contexts: updatedContexts });
    await get().save();
  },

  deleteContext: async (contextId) => {
    const updatedContexts = get().contexts.filter(c => c.id !== contextId);
    const updatedTasks = get().tasks.filter(t => t.contextId !== contextId);
    set({ contexts: updatedContexts, tasks: updatedTasks });
    await get().save();
  },

  updateSwimlaneOrder: async (laneIds) => {
    const updatedContexts = get().contexts.map(c => {
      const index = laneIds.indexOf(c.id);
      return { ...c, position: index !== -1 ? index : c.position };
    }).sort((a, b) => a.position - b.position);
    
    set({ contexts: updatedContexts });
    await get().save();
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
    await get().save();
  },

  updateColumn: async (column) => {
    const updatedColumns = get().columns.map(c => c.id === column.id ? column : c).sort((a, b) => a.position - b.position);
    set({ columns: updatedColumns });
    await get().save();
  },

  deleteColumn: async (columnId) => {
    const updatedColumns = get().columns.filter(c => c.id !== columnId);
    set({ columns: updatedColumns });
    await get().save();
  },

  updateColumnOrder: async (columnIds) => {
    const updatedColumns = get().columns.map(c => {
      const index = columnIds.indexOf(c.id);
      return { ...c, position: index !== -1 ? index : c.position };
    }).sort((a, b) => a.position - b.position);
    
    set({ columns: updatedColumns });
    await get().save();
  },

  toggleLaneCollapsed: (contextId) => {
    const collapsed = get().collapsedLanes;
    const updated = collapsed.includes(contextId)
      ? collapsed.filter(id => id !== contextId)
      : [...collapsed, contextId];
    set({ collapsedLanes: updated });
    try {
      localStorage.setItem(COLLAPSED_LANES_KEY, JSON.stringify(updated));
    } catch {
      // Storage unavailable (e.g. private mode): keep the in-memory state only.
    }
  },

  setArchiveOpen: (archiveOpen) => {
    set({ archiveOpen });
    if (archiveOpen) get().loadArchive();
  },

  loadArchive: async () => {
    set({ archivedTasks: null, archiveError: null });
    try {
      set({ archivedTasks: await storageProvider.getArchive() });
    } catch (error) {
      console.error('Failed to load archive', error);
      set({ archiveError: errorMessage(error), ...needsTokenIf(error) });
    }
  },

  // Archive and restore wait for pending saves. The store mirrors the server's move locally, unless
  // the server moved fewer tasks than asked (e.g. archived elsewhere meanwhile): then it reloads.
  // No reload after a failed save, though: it would drop the unsaved changes.
  archiveTasks: (taskIds) =>
    enqueueWrite(async () => {
      const archived = await storageProvider.archiveTasks(taskIds);
      if (archived === taskIds.length) set({ tasks: get().tasks.filter(t => !taskIds.includes(t.id)) });
      else if (!get().saveError) set(boardState(await storageProvider.getData()));
    }).catch(error => {
      console.error('Failed to archive tasks', error);
      set({ saveError: errorMessage(error), ...needsTokenIf(error) });
    }),

  restoreTasks: (taskIds) =>
    enqueueWrite(async () => {
      const restored = await storageProvider.restoreTasks(taskIds);
      const archived = get().archivedTasks ?? [];
      if (restored === taskIds.length) {
        const updatedAt = new Date().toISOString();
        set({
          tasks: [...get().tasks, ...archived.filter(t => taskIds.includes(t.id)).map(t => unarchiveTask(t, updatedAt))],
          archivedTasks: archived.filter(t => !taskIds.includes(t.id)),
        });
      } else if (!get().saveError) {
        set(boardState(await storageProvider.getData()));
        await get().loadArchive();
      }
    }).catch(error => {
      console.error('Failed to restore tasks', error);
      set({ saveError: errorMessage(error), ...needsTokenIf(error) });
    }),
}));
