'use client';

import { useEffect, useState } from 'react';

import { formatCount } from '@/lib/format';

export function VisitorWidget({ initialCounts }) {
  const [counts, setCounts] = useState(initialCounts);

  useEffect(() => {
    let active = true;

    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname })
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
      .then((payload) => {
        if (active && payload) {
          setCounts(payload);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3 sm:min-w-[220px]">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">오늘</span>
        <strong className="mt-2 block text-lg font-semibold tracking-[-0.03em] text-slate-950">{formatCount(counts.daily)}</strong>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">누적</span>
        <strong className="mt-2 block text-lg font-semibold tracking-[-0.03em] text-slate-950">{formatCount(counts.total)}</strong>
      </div>
    </div>
  );
}
