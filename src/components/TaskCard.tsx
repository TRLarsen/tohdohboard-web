'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import { MoreVertical, Clock, CalendarDays } from 'lucide-react';
import { doneColumnId, formatDueDate, localToday } from '@/lib/board';
import { useStore } from '@/store/useStore';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const { editMode, columns } = useStore();
  // Both sides are local "YYYY-MM-DD" strings, so string order is date order (no UTC shift).
  const overdue = !!task.dueDate && task.dueDate < localToday() && task.status !== doneColumnId(columns);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
    disabled: editMode,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!editMode) onClick(task);
      }}
      className={`p-3 mb-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-sm ${!editMode ? 'cursor-grab active:cursor-grabbing hover:border-neutral-500' : 'opacity-50'} transition-colors group`}
    >
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-neutral-200 line-clamp-2">{task.title}</h4>
        <button className="text-neutral-500 hover:text-neutral-300 p-1 -mr-2">
          <MoreVertical size={14} />
        </button>
      </div>
      
      {task.description && (
        <p className="mt-1 text-xs text-neutral-400 line-clamp-2">{task.description}</p>
      )}
      
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          {task.dueDate && (
            <span
              title={`Due ${task.dueDate}${overdue ? ' (overdue)' : ''}`}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium whitespace-nowrap ${overdue ? 'bg-red-950/60 text-red-300 border-red-800' : 'bg-neutral-900 text-neutral-400 border-neutral-700'}`}
            >
              <CalendarDays size={10} />
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
        <div className="flex items-center text-[10px] text-neutral-500">
          <Clock size={10} className="mr-1" />
          <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

