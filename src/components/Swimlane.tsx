'use client';

import React from 'react';
import { Context, Task, Column as ColumnType } from '@/types';
import { Column } from './Column';
import { Settings, GripVertical } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SwimlaneProps {
  context: Context;
  columns: ColumnType[];
  tasks: Task[];
  onAddTask: (status: string, contextId: string) => void;
  onTaskClick: (task: Task) => void;
  onManageContext: (context: Context) => void;
}

export const Swimlane: React.FC<SwimlaneProps> = ({ 
  context, 
  columns,
  tasks, 
  onAddTask, 
  onTaskClick,
  onManageContext 
}) => {
  const { editMode } = useStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `swimlane-${context.id}`,
    data: {
      type: 'Swimlane',
      context,
    },
    disabled: !editMode,
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
      className={`mb-8 last:mb-0 ${editMode ? 'p-4 border-2 border-dashed border-neutral-700 rounded-xl bg-neutral-900/30' : ''}`}
    >
      <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          {editMode && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-neutral-300 mr-2">
              <GripVertical size={20} />
            </div>
          )}
          <h2 className="text-lg font-bold text-neutral-100 tracking-tight">{context.name}</h2>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-neutral-800 text-neutral-400 rounded-full border border-neutral-700 uppercase">
            {context.id}
          </span>
        </div>
        <button 
          onClick={() => onManageContext(context)}
          className="text-neutral-500 hover:text-neutral-300 p-1.5 rounded-md hover:bg-neutral-800 transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {columns.map(column => (
          <Column
            key={`${context.id}:${column.id}`}
            id={`${context.id}:${column.id}`}
            contextId={context.id}
            column={column}
            tasks={tasks.filter(t => t.status === column.id && t.contextId === context.id)}
            onAddTask={onAddTask}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
};
