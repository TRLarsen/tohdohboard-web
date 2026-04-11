'use client';

import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { STATUSES } from '@/constants';
import { X, Trash2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description: string, status: TaskStatus, contextId: string) => void;
  onDelete?: (taskId: string) => void;
  task?: Task;
  defaultStatus?: TaskStatus;
  defaultContextId?: string;
  contexts: { id: string, name: string }[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  defaultStatus,
  defaultContextId,
  contexts,
}) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(
    task?.status || defaultStatus || STATUSES[0]
  );
  const [contextId, setContextId] = useState(
    task?.contextId || defaultContextId || (contexts.length > 0 ? contexts[0].id : '')
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contextId) return;
    onSave(title, description, status, contextId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="What needs to be done?"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
              placeholder="Add more details..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Context</label>
              <select
                value={contextId}
                onChange={(e) => setContextId(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
              >
                {contexts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            {task && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(task.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-red-500 hover:text-red-400 text-sm font-medium transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            ) : <div />}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20"
              >
                {task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
