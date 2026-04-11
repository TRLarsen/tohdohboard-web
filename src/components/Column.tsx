'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Column as ColumnType } from '@/types';
import { TaskCard } from './TaskCard';
import { Plus, GripVertical, Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface ColumnProps {
  id: string; // contextId:columnId
  contextId: string;
  column: ColumnType;
  tasks: Task[];
  onAddTask: (status: string, contextId: string) => void;
  onTaskClick: (task: Task) => void;
}

export const Column: React.FC<ColumnProps> = ({ id, contextId, column, tasks, onAddTask, onTaskClick }) => {
  const { editMode } = useStore();
  
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      contextId,
      status: column.id,
    },
    disabled: editMode,
  });

  return (
    <div
      ref={setDroppableRef}
      className={`flex-1 min-w-[200px] p-2 bg-neutral-900/50 border border-neutral-800 rounded-lg transition-colors min-h-[150px] ${
        isOver && !editMode ? 'bg-neutral-800 border-blue-600/50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{column.name}</h3>
        </div>
        {!editMode && (
          <button
            onClick={() => onAddTask(column.id, contextId)}
            className="text-neutral-500 hover:text-blue-500 p-1 rounded transition-colors"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
      
      {!editMode ? (
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
            {tasks.length === 0 && !isOver && (
              <div className="h-full py-4 flex items-center justify-center border border-dashed border-neutral-800 rounded-md">
                 <span className="text-[10px] text-neutral-600 italic">No tasks</span>
              </div>
            )}
          </div>
        </SortableContext>
      ) : (
        <div className="h-full flex items-center justify-center py-4 opacity-30">
          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Edit Mode</span>
        </div>
      )}
    </div>
  );
};
