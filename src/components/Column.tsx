'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface ColumnProps {
  id: string; // contextId:status
  contextId: string;
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus, contextId: string) => void;
  onTaskClick: (task: Task) => void;
}

export const Column: React.FC<ColumnProps> = ({ id, contextId, status, tasks, onAddTask, onTaskClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      contextId,
      status,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[200px] p-2 bg-neutral-900/50 border border-neutral-800 rounded-lg transition-colors min-h-[150px] ${
        isOver ? 'bg-neutral-800 border-blue-600/50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{status}</h3>
        <button
          onClick={() => onAddTask(status, contextId)}
          className="text-neutral-500 hover:text-blue-500 p-1 rounded transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      
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
    </div>
  );
};
