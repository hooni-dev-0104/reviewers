'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAppClient } from '@/components/app-client-providers';
import { Button, Surface } from '@/components/ui-kit';
import { cn } from '@/lib/ui';

const OPTIONS = [3, 24, 72];

export function ReminderManager({ campaignId }) {
  const router = useRouter();
  const { session, loading } = useAppClient();
  const [value, setValue] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }
    fetch(`/api/reminders?campaignId=${campaignId}`)
      .then((response) => response.json())
      .then((payload) => setValue(payload.item?.remind_before_hours || null))
      .catch(() => {});
  }, [campaignId, session]);

  async function saveReminder(hours) {
    if (!session) {
      router.push(`/account?next=/campaign/${campaignId}`);
      return;
    }

    setPending(true);
    const response = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, remindBeforeHours: hours })
    });
    const payload = await response.json();
    setPending(false);
    if (response.ok) {
      setValue(payload.item?.remind_before_hours || null);
    }
  }

  async function clearReminder() {
    setPending(true);
    const response = await fetch(`/api/reminders?campaignId=${campaignId}`, { method: 'DELETE' });
    setPending(false);
    if (response.ok) {
      setValue(null);
    }
  }

  if (loading) {
    return <Surface className="space-y-2 p-5"><span className="text-sm text-slate-500">마감 리마인드를 확인하는 중…</span></Surface>;
  }

  return (
    <Surface className="space-y-4 p-5">
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Deadline reminder</span>
        <strong className="block text-xl font-semibold tracking-[-0.03em] text-slate-950">마감 리마인드</strong>
        <p className="text-sm leading-6 text-slate-600">{session ? '로그인한 계정에 맞춰 마감 알림 시점을 저장해요.' : '로그인하면 마감 리마인드를 저장할 수 있어요.'}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((hours) => (
          <button
            key={hours}
            type="button"
            className={cn(
              'inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
              value === hours ? 'border-indigo-100 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
            onClick={() => saveReminder(hours)}
            disabled={pending}
          >
            {hours}시간 전
          </button>
        ))}
        {value ? (
          <Button type="button" variant="ghost" size="sm" className="border border-slate-200" onClick={clearReminder} disabled={pending}>
            리마인드 해제
          </Button>
        ) : null}
      </div>
    </Surface>
  );
}
