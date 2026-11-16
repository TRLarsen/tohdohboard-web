'use client';

import React, { useState } from 'react';
import { KeyRound, TriangleAlert } from 'lucide-react';
import { useStore } from '@/store/useStore';

/** Asks for the backend's access token after a 401; the token is kept in localStorage. */
export const TokenModal: React.FC = () => {
  const { needsToken, hasToken, submitToken, forgetToken, dismissTokenPrompt } = useStore();
  const [token, setToken] = useState('');
  const [invalid, setInvalid] = useState(false);

  if (!needsToken) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    // Header values must be printable ASCII; anything else can't be a token the server issued.
    if (!/^[\x21-\x7e]+$/.test(token.trim())) return setInvalid(true);
    submitToken(token.trim());
    setToken('');
    setInvalid(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-4 space-y-4 text-left bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl">
        <div className="flex items-center gap-2 text-neutral-100">
          <KeyRound size={18} />
          <h2 className="text-lg font-semibold">Access token</h2>
        </div>
        <p className="text-sm text-neutral-400">
          {invalid
            ? 'Invalid token: it contains spaces or characters other than plain ASCII.'
            : hasToken ? 'The server rejected the saved token.' : 'This board requires an access token.'}
        </p>
        <input
          autoFocus
          type="password"
          autoComplete="current-password"
          aria-label="Access token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Paste your token"
        />
        <div className="flex items-center justify-between">
          {hasToken ? (
            <button type="button" onClick={forgetToken} className="text-sm font-medium text-red-500 hover:text-red-400">
              Forget token
            </button>
          ) : <div />}
          <div className="flex gap-3">
            <button type="button" onClick={dismissTokenPrompt} className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg">
              Connect
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

/** Non-blocking notice that the last change did not reach the server. */
export const SaveErrorBanner: React.FC = () => {
  const { saveError, save } = useStore();

  if (!saveError) return null;

  return (
    <div role="status" className="fixed bottom-4 inset-x-4 z-40 mx-auto flex max-w-md items-center gap-3 px-4 py-3 text-sm text-amber-200 bg-amber-950/90 border border-amber-700 rounded-lg shadow-lg">
      <TriangleAlert size={16} className="shrink-0" />
      <span className="flex-1">Changes not saved: {saveError}</span>
      <button onClick={save} className="font-semibold text-amber-100 hover:text-white">
        Retry
      </button>
    </div>
  );
};
