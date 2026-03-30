'use client';

import { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { useAppClient } from '@/components/app-client-providers';
import { getButtonClasses } from '@/lib/ui';

export function SavedCampaignButton({ campaignId }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, savedIds, toggleSaved } = useAppClient();
  const saved = useMemo(() => savedIds.includes(campaignId), [savedIds, campaignId]);

  async function onToggle() {
    const result = await toggleSaved(campaignId);
    if (result?.requiresAuth) {
      router.push(`/account?next=${encodeURIComponent(pathname || '/saved')}`);
    }
  }

  return (
    <button
      type="button"
      className={getButtonClasses({
        variant: saved ? 'subtle' : 'secondary',
        size: 'md',
        className: 'w-full sm:w-auto'
      })}
      onClick={onToggle}
    >
      {!session ? '로그인 후 저장' : saved ? '저장됨' : '저장'}
    </button>
  );
}
