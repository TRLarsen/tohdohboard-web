'use client';

import React, { useState } from 'react';
import { Context } from '@/types';
import { X, Trash2 } from 'lucide-react';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, context?: Context) => void;
  onDelete?: (contextId: string) => void;
  context?: Context;
}

export const ContextModal: React.FC<ContextModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  context,
}) => {
  const [name, setName] = useState(context?.name || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name, context);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100">
            {context ? 'Edit Context' : 'New Context'}
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Context Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g. Work, School, Projects"
              required
            />
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            {context && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(context.id);
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
                {context ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
