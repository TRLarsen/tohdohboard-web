'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import { MoreVertical, Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const { editMode } = useStore();
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
      
      <div className="mt-3 flex items-center justify-between">
        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        <div className="flex items-center text-[10px] text-neutral-500">
          <Clock size={10} className="mr-1" />
          <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

