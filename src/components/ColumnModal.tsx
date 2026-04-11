'use client';

import React, { useState, useEffect } from 'react';
import { Column } from '@/types';
import { X, Trash2, Plus, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: Column[];
  onAdd: (name: string) => void;
  onUpdate: (column: Column) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
}

interface SortableItemProps {
  column: Column;
  onUpdate: (column: Column) => void;
  onDelete: (id: string) => void;
}

const SortableColumnItem: React.FC<SortableItemProps> = ({ column, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-neutral-800 border border-neutral-700 rounded-lg mb-2 group"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-400">
        <GripVertical size={16} />
      </div>
      <input
        type="text"
        value={column.name}
        onChange={(e) => onUpdate({ ...column, name: e.target.value })}
        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-neutral-200"
      />
      <button
        onClick={() => onDelete(column.id)}
        className="text-neutral-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

export const ColumnModal: React.FC<ColumnModalProps> = ({
  isOpen,
  onClose,
  columns,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}) => {
  const [newName, setNewName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((c) => c.id === active.id);
      const newIndex = columns.findIndex((c) => c.id === over.id);
      const newOrder = arrayMove(columns.map(c => c.id), oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100">Manage Columns</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleAdd} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New column name..."
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </form>

          <div className="max-h-60 overflow-y-auto pr-1">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columns.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {columns.map((column) => (
                  <SortableColumnItem
                    key={column.id}
                    column={column}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
