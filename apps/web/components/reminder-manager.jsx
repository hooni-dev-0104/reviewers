'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAppClient } from '@/components/app-client-providers';

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
    return <div className="reminder-box"><span>리마인드 확인 중…</span></div>;
  }

  return (
    <div className="reminder-box">
      <strong>마감 리마인드</strong>
      <span>{session ? '저장된 계정 기준으로 알림 시점을 관리해요.' : '로그인하면 마감 리마인드를 저장할 수 있어요.'}</span>
      <div className="reminder-options">
        {OPTIONS.map((hours) => (
          <button key={hours} type="button" className={value === hours ? 'reminder-active' : ''} onClick={() => saveReminder(hours)} disabled={pending}>
            {hours}시간 전
          </button>
        ))}
        {value ? <button type="button" onClick={clearReminder} disabled={pending}>해제</button> : null}
      </div>
    </div>
  );
}
