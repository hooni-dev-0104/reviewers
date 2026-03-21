'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AppContext = createContext(null);

export function AppClientProviders({ children, initialSession = null }) {
  const [session, setSession] = useState(initialSession);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshAll({ background: true });
  }, []);

  async function refreshAll({ background = false } = {}) {
    if (!background) {
      setLoading(true);
    }
    try {
      const sessionResponse = await fetch('/api/auth/session');
      const sessionPayload = await sessionResponse.json();
      const nextSession = sessionPayload.user || null;
      setSession(nextSession);

      if (nextSession) {
        const savedResponse = await fetch('/api/saved');
        const savedPayload = await savedResponse.json();
        setSavedIds(Array.isArray(savedPayload.ids) ? savedPayload.ids : []);
      } else {
        setSavedIds([]);
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }

  async function toggleSaved(campaignId) {
    if (!session) {
      return { requiresAuth: true };
    }

    const response = await fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId })
    });

    const payload = await response.json();
    if (response.ok) {
      setSavedIds(Array.isArray(payload.ids) ? payload.ids : []);
      window.dispatchEvent(new CustomEvent('reviewers:saved-updated', { detail: payload.ids || [] }));
    }
    return payload;
  }

  const value = useMemo(() => ({ session, savedIds, loading, refreshAll, toggleSaved, setSession }), [session, savedIds, loading]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppClient() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppClient must be used within AppClientProviders');
  }
  return context;
}
