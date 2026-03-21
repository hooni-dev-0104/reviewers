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
    <div className="visitor-widget">
      <span>오늘 {formatCount(counts.daily)}</span>
      <span className="divider" />
      <span>전체 {formatCount(counts.total)}</span>
    </div>
  );
}
