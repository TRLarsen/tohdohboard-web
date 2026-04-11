'use client';

import React from 'react';
import { Context, Task, TaskStatus } from '@/types';
import { Column } from './Column';
import { STATUSES } from '@/constants';
import { Settings } from 'lucide-react';

interface SwimlaneProps {
  context: Context;
  tasks: Task[];
  onAddTask: (status: TaskStatus, contextId: string) => void;
  onTaskClick: (task: Task) => void;
  onManageContext: (context: Context) => void;
}

export const Swimlane: React.FC<SwimlaneProps> = ({ 
  context, 
  tasks, 
  onAddTask, 
  onTaskClick,
  onManageContext 
}) => {
  return (
    <div className="mb-8 last:mb-0">
      <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
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
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STATUSES.map(status => (
          <Column
            key={`${context.id}:${status}`}
            id={`${context.id}:${status}`}
            contextId={context.id}
            status={status}
            tasks={tasks.filter(t => t.status === status && t.contextId === context.id)}
            onAddTask={onAddTask}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
};
