'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { useAppClient } from '@/components/app-client-providers';

export function SavedCampaignButton({ campaignId }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { session, savedIds, toggleSaved } = useAppClient();
  const saved = useMemo(() => savedIds.includes(campaignId), [savedIds, campaignId]);

  async function onToggle() {
    if (pending) return;
    setPending(true); setError(false);
    try {
      const result = await toggleSaved(campaignId);
      if (result?.requiresAuth) router.push(`/account?next=${encodeURIComponent(pathname || '/saved')}`);
      else if (result?.error) setError(true);
    } catch { setError(true); }
    finally { setPending(false); }
  }

  return (
    <><button disabled={pending} aria-pressed={saved} type="button" className={`save-toggle ${saved ? 'is-saved' : ''}`} onClick={onToggle}>
      {!session ? '로그인 후 저장' : saved ? '저장됨' : '저장'}
    </button>{error ? <span role="alert">저장에 실패했어요. 다시 시도해 주세요.</span> : null}</>
  );
}
