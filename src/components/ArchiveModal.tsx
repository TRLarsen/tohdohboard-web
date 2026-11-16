'use client';

import React from 'react';
import { X, ArchiveRestore } from 'lucide-react';
import { useStore } from '@/store/useStore';

export const ArchiveModal: React.FC = () => {
  const { archiveOpen, setArchiveOpen, archivedTasks, archiveError, contexts, restoreTasks } = useStore();

  if (!archiveOpen) return null;

  const laneName = (contextId: string) => contexts.find(c => c.id === contextId)?.name ?? contextId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100">Archive</h2>
          <button onClick={() => setArchiveOpen(false)} aria-label="Close" className="text-neutral-500 hover:text-neutral-300">
            <X size={20} />
          </button>
        </div>

        <ul className="overflow-y-auto divide-y divide-neutral-800">
          {archivedTasks?.map(task => (
            <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-200 truncate">{task.title}</p>
                <p className="text-xs text-neutral-500">
                  {laneName(task.contextId)} · archived {new Date(task.archivedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => restoreTasks([task.id])}
                className="flex items-center gap-1.5 shrink-0 px-3 py-2 text-sm font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
              >
                <ArchiveRestore size={14} />
                Restore
              </button>
            </li>
          ))}
          {archivedTasks?.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-neutral-500">No archived tasks.</li>
          )}
          {!archivedTasks && (
            <li className={`px-4 py-10 text-center text-sm text-neutral-500 ${archiveError ? '' : 'animate-pulse'}`}>
              {archiveError ? `Couldn't load the archive: ${archiveError}` : 'Loading…'}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
