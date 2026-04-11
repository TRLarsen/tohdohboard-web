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
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useStore } from '@/store/useStore';
import { Swimlane } from './Swimlane';
import { Task, TaskStatus, Context } from '@/types';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { ContextModal } from './ContextModal';
import { Plus, LayoutGrid } from 'lucide-react';

export const Board: React.FC = () => {
  const { 
    tasks, 
    contexts, 
    loading, 
    loadData, 
    moveTask, 
    addTask, 
    updateTask, 
    deleteTask,
    addContext,
    updateContext,
    deleteContext
  } = useStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus | undefined>(undefined);
  const [defaultContextId, setDefaultContextId] = useState<string | undefined>(undefined);
  
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<Context | undefined>(undefined);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-neutral-500 font-medium">Loading OmniBoard...</div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (isActiveATask && isOverAColumn) {
      // Handled in onDragEnd for simplicity if we don't need live reordering between cells
      // But for better UX, we could update state here
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

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
      // Note: Reordering within column is not explicitly implemented in moveTask 
      // but could be added by sorting tasks by a 'position' field.
    }
  };

  const handleAddTask = (status: TaskStatus, contextId: string) => {
    setSelectedTask(undefined);
    setDefaultStatus(status);
    setDefaultContextId(contextId);
    setIsTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (title: string, description: string, status: TaskStatus, contextId: string) => {
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
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/40 text-white">
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-2xl font-black text-neutral-100 tracking-tight">OmniBoard</h1>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => {
              setSelectedContext(undefined);
              setIsContextModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold rounded-lg border border-neutral-700 transition-all"
          >
            <Plus size={16} />
            Add Swimlane
          </button>
          
          <button
            onClick={() => {
              setSelectedTask(undefined);
              setDefaultStatus(undefined);
              setDefaultContextId(undefined);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto pb-10">
          <div className="min-w-full inline-block align-middle">
            {contexts.sort((a, b) => a.order - b.order).map(context => (
              <Swimlane
                key={context.id}
                context={context}
                tasks={tasks}
                onAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
                onManageContext={handleManageContext}
              />
            ))}
            
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
        </DragOverlay>
      </DndContext>

      <TaskModal
        key={selectedTask?.id || `new-task-${defaultStatus || 'none'}-${defaultContextId || 'none'}-${isTaskModalOpen}`}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={deleteTask}
        task={selectedTask}
        defaultStatus={defaultStatus}
        defaultContextId={defaultContextId}
        contexts={contexts}
      />

      <ContextModal
        key={selectedContext?.id || `new-context-${isContextModalOpen}`}
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        onSave={handleSaveContext}
        onDelete={deleteContext}
        context={selectedContext}
      />
    </div>
  );
};
