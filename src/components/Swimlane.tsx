'use client';

import React from 'react';
import { Context, Task, Column as ColumnType } from '@/types';
import { Column } from './Column';
import { Settings, GripVertical, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { doneColumnId } from '@/lib/board';

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
  const { editMode, collapsedLanes, toggleLaneCollapsed, archiveTasks } = useStore();
  const collapsed = collapsedLanes.includes(context.id);
  const laneTasks = tasks.filter(t => t.contextId === context.id);
  const doneId = doneColumnId(columns);
  const bodyId = `swimlane-body-${context.id}`;

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
      {/* Pinned to the visible width of the scrolling board (@container in Board) so it stays on screen while columns scroll. */}
      <div className={`sticky z-10 flex items-center justify-center gap-2 mb-4 border-b border-neutral-800 pb-2 md:justify-between ${editMode ? 'left-4 w-[calc(100cqw-2rem)]' : 'left-0 w-[100cqw]'}`}>
        <div className="flex items-center gap-2 min-w-0">
          {editMode && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-neutral-300 mr-2">
              <GripVertical size={20} />
            </div>
          )}
          <button
            type="button"
            onClick={() => toggleLaneCollapsed(context.id)}
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${context.name}`}
            className="flex items-center justify-center w-10 h-10 -ml-2 md:w-8 md:h-8 shrink-0 text-neutral-500 hover:text-neutral-300 rounded-md hover:bg-neutral-800 transition-colors"
          >
            <ChevronDown size={18} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
          </button>
          <h2 title={context.name} className="text-lg font-bold text-neutral-100 tracking-tight truncate">{context.name}</h2>
          <span className="hidden md:inline px-2 py-0.5 text-[10px] font-medium bg-neutral-800 text-neutral-400 rounded-full border border-neutral-700 uppercase">
            {context.id}
          </span>
          {collapsed && (
            <span className="text-xs text-neutral-500 whitespace-nowrap">
              {laneTasks.length} {laneTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          )}
        </div>
        <button 
          onClick={() => onManageContext(context)}
          className="text-neutral-500 hover:text-neutral-300 p-1.5 rounded-md hover:bg-neutral-800 transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>
      
      {!collapsed && (
        <div id={bodyId} className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {columns.map(column => {
            const columnTasks = laneTasks.filter(t => t.status === column.id);
            return (
              <Column
                key={`${context.id}:${column.id}`}
                id={`${context.id}:${column.id}`}
                contextId={context.id}
                column={column}
                tasks={columnTasks}
                onAddTask={onAddTask}
                onTaskClick={onTaskClick}
                onArchiveAll={column.id === doneId ? () => archiveTasks(columnTasks.map(t => t.id)) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
