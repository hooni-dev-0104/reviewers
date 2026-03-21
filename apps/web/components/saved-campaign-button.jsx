'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'reviewers.savedCampaignIds';

export function SavedCampaignButton({ campaignId }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readSavedIds().includes(campaignId));
  }, [campaignId]);

  function toggleSaved() {
    const nextIds = readSavedIds();
    const updated = nextIds.includes(campaignId)
      ? nextIds.filter((id) => id !== campaignId)
      : [campaignId, ...nextIds].slice(0, 100);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaved(updated.includes(campaignId));
    window.dispatchEvent(new CustomEvent('reviewers:saved-updated', { detail: updated }));
  }

  return (
    <button type="button" className={`save-toggle ${saved ? 'is-saved' : ''}`} onClick={toggleSaved}>
      {saved ? '저장됨' : '저장'}
    </button>
  );
}

function readSavedIds() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (_error) {
    return [];
  }
}
