'use client';

import React, { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useStore } from '@/store/useStore';
import { Swimlane } from './Swimlane';
import { Task, Context, Column as ColumnType } from '@/types';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { ContextModal } from './ContextModal';
import { ColumnModal } from './ColumnModal';
import { ArchiveModal } from './ArchiveModal';
import { TokenModal, SaveErrorBanner } from './ConnectionStatus';
import { Plus, LayoutGrid, Settings, X, Columns, Archive, KeyRound } from 'lucide-react';

export const Board: React.FC = () => {
  const { 
    tasks, 
    contexts, 
    columns,
    loading, 
    loaded,
    loadError,
    hasToken,
    forgetToken,
    loadData, 
    refresh,
    moveTask, 
    addTask, 
    updateTask, 
    deleteTask,
    addContext,
    updateContext,
    deleteContext,
    updateSwimlaneOrder,
    addColumn,
    updateColumn,
    deleteColumn,
    updateColumnOrder,
    archiveTasks,
    setArchiveOpen,
    editMode,
    setEditMode
  } = useStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeSwimlane, setActiveSwimlane] = useState<Context | null>(null);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [defaultStatus, setDefaultStatus] = useState<string | undefined>(undefined);
  const [defaultContextId, setDefaultContextId] = useState<string | undefined>(undefined);
  
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<Context | undefined>(undefined);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Catch up with changes made elsewhere whenever the user comes back to the page; no polling.
  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', onReturn);
    document.addEventListener('visibilitychange', onReturn);
    return () => {
      window.removeEventListener('focus', onReturn);
      document.removeEventListener('visibilitychange', onReturn);
    };
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-neutral-500 font-medium">Loading TohdohBoard...</div>
      </div>
    );
  }

  // Never show (and later save) an empty board when loading failed.
  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-96 text-center">
        <p className="font-medium text-neutral-200">Couldn&apos;t load the board.</p>
        <p className="text-sm text-neutral-500">{loadError}</p>
        <button
          onClick={loadData}
          className="px-6 py-2.5 bg-neutral-800 text-neutral-200 text-sm font-semibold rounded-lg border border-neutral-700 hover:bg-neutral-700 transition-colors"
        >
          Retry
        </button>
        <TokenModal />
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === 'Task') {
      const task = tasks.find((t) => t.id === active.id);
      if (task) setActiveTask(task);
    } else if (type === 'Swimlane') {
      const swimlane = contexts.find(c => `swimlane-${c.id}` === active.id);
      if (swimlane) setActiveSwimlane(swimlane);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Only handle task dragging over columns during Task Mode
    if (editMode) return;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveSwimlane(null);

    if (!over) return;

    if (editMode && active.data.current?.type === 'Swimlane' && over.data.current?.type === 'Swimlane') {
      const activeId = active.data.current.context.id;
      const overId = over.data.current.context.id;
      if (activeId !== overId) {
        const oldIndex = contexts.findIndex(c => c.id === activeId);
        const newIndex = contexts.findIndex(c => c.id === overId);
        
        // Use raw IDs for the backend update
        const newOrder = arrayMove(contexts, oldIndex, newIndex).map(c => c.id);
        updateSwimlaneOrder(newOrder);
      }
      return;
    }

    if (!editMode && active.data.current?.type === 'Task') {
      const activeId = active.id as string;
      const activeTask = tasks.find(t => t.id === activeId);
      if (!activeTask) return;

      // Over a column
      if (over.data.current?.type === 'Column') {
        const { status, contextId } = over.data.current;
        if (activeTask.status !== status || activeTask.contextId !== contextId) {
          moveTask(activeId, status, contextId);
        }
        return;
      }

      // Over another task
      if (over.data.current?.type === 'Task') {
        const overTask = over.data.current.task as Task;
        if (activeTask.status !== overTask.status || activeTask.contextId !== overTask.contextId) {
          moveTask(activeId, overTask.status, overTask.contextId);
        }
      }
    }
  };

  const handleAddTask = (status: string, contextId: string) => {
    setSelectedTask(undefined);
    setDefaultStatus(status);
    setDefaultContextId(contextId);
    setIsTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (title: string, description: string, status: string, contextId: string) => {
    if (selectedTask) {
      updateTask({ ...selectedTask, title, description, status, contextId });
    } else {
      addTask(title, description, status, contextId);
    }
  };

  const handleManageContext = (context: Context) => {
    setSelectedContext(context);
    setIsContextModalOpen(true);
  };

  const handleSaveContext = (name: string, context?: Context) => {
    if (context) {
      updateContext({ ...context, name });
    } else {
      addContext(name);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/40 text-white">
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-2xl font-black text-neutral-100 tracking-tight">TohdohBoard</h1>
        </div>
        
        <div className="flex flex-wrap gap-2 md:gap-4">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 whitespace-nowrap text-sm font-semibold rounded-lg border transition-all ${editMode ? 'bg-amber-600/20 border-amber-600 text-amber-500 hover:bg-amber-600/30' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'}`}
          >
            {editMode ? <X size={16} /> : <Settings size={16} />}
            {editMode ? 'Exit Edit Mode' : 'Edit Mode'}
          </button>

          {editMode && (
            <button
              onClick={() => setIsColumnModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 whitespace-nowrap bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold rounded-lg border border-neutral-700 transition-all animate-in fade-in slide-in-from-right-4"
            >
              <Columns size={16} />
              Manage Columns
            </button>
          )}

          {!editMode && (
            <>
              <button
                onClick={() => {
                  setSelectedContext(undefined);
                  setIsContextModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 whitespace-nowrap bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold rounded-lg border border-neutral-700 transition-all"
              >
                <Plus size={16} />
                Add Swimlane
              </button>

              <button
                onClick={() => setArchiveOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 whitespace-nowrap bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold rounded-lg border border-neutral-700 transition-all"
              >
                <Archive size={16} />
                Archive
              </button>
              
              <button
                onClick={() => {
                  setSelectedTask(undefined);
                  setDefaultStatus(undefined);
                  setDefaultContextId(undefined);
                  setIsTaskModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all"
              >
                <Plus size={16} />
                New Task
              </button>

              {hasToken && (
                <button
                  onClick={() => window.confirm('Forget the access token saved on this device?') && forgetToken()}
                  title="Forget access token"
                  aria-label="Forget access token"
                  className="flex items-center justify-center px-3 py-2.5 md:py-2 text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-all"
                >
                  <KeyRound size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="@container flex-1 overflow-x-auto pb-10">
          <div className="min-w-full inline-block align-middle">
            <SortableContext items={contexts.map(c => `swimlane-${c.id}`)} strategy={verticalListSortingStrategy}>
              {contexts.map(context => (
                <Swimlane
                  key={context.id}
                  context={context}
                  columns={columns}
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onTaskClick={handleTaskClick}
                  onManageContext={handleManageContext}
                />
              ))}
            </SortableContext>
            
            {contexts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-800 rounded-2xl">
                <p className="text-neutral-500 mb-4">No swimlanes yet. Add one to get started!</p>
                <button
                   onClick={() => setIsContextModalOpen(true)}
                   className="px-6 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Create Your First Swimlane
                </button>
              </div>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeTask ? (
            <div className="w-[200px] pointer-events-none">
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          ) : null}
          {activeSwimlane ? (
            <div className="opacity-80 p-4 bg-neutral-800 border-2 border-blue-500 rounded-lg pointer-events-none">
              <h2 className="text-lg font-bold text-neutral-100">{activeSwimlane.name}</h2>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        key={selectedTask?.id || `new-task-${defaultStatus || 'none'}-${defaultContextId || 'none'}-${isTaskModalOpen}`}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={deleteTask}
        onArchive={(taskId) => archiveTasks([taskId])}
        task={selectedTask}
        defaultStatus={defaultStatus}
        defaultContextId={defaultContextId}
        contexts={contexts}
        columns={columns}
      />

      <ContextModal
        key={selectedContext?.id || `new-context-${isContextModalOpen}`}
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        onSave={handleSaveContext}
        onDelete={deleteContext}
        context={selectedContext}
      />

      <ArchiveModal />
      <TokenModal />
      <SaveErrorBanner />

      <ColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        columns={columns}
        onAdd={addColumn}
        onUpdate={updateColumn}
        onDelete={deleteColumn}
        onReorder={updateColumnOrder}
      />
    </div>
  );
};
