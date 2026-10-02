'use client';
import { useEffect, useRef } from 'react';
import { safeExternalUrl } from '@/lib/sponsor-policy';
import { sendEvent, trackingAllowed } from '@/lib/event-client';
import { TrackedLink } from '@/components/tracked-link';
import { Badge } from '@/components/ui';

export function SponsorSlot({ sponsor }) {
  const root = useRef(null);
  const seen = useRef(false);
  const ctaUrl = safeExternalUrl(sponsor?.cta_url);
  useEffect(() => {
    if (!sponsor?.measurementEnabled || !trackingAllowed() || !root.current || !window.IntersectionObserver) return;
    let timer, visible = false;
    const clear = () => { clearTimeout(timer); timer = null; };
    const check = () => {
      clear();
      if (visible && document.visibilityState === 'visible' && !seen.current) timer = setTimeout(() => {
        seen.current = true;
        sendEvent('sponsor_impression', sponsor.id, sponsor.slot_key);
      }, 1000);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && entry.intersectionRatio >= .5; check(); }, { threshold: [.5] });
    observer.observe(root.current);
    document.addEventListener('visibilitychange', check);
    return () => { clear(); observer.disconnect(); document.removeEventListener('visibilitychange', check); };
  }, [sponsor?.id, sponsor?.slot_key, sponsor?.measurementEnabled]);
  if (!ctaUrl) return null;
  return (
    <aside ref={root} className="sponsor-slot" aria-label="유료 광고·제휴">
      <Badge tone="sponsor" showIcon>광고</Badge>
      <strong>{sponsor.title}</strong>
      <p>{sponsor.body}</p>
      <span>유료 광고·제휴 · 일반 캠페인 순위와 무관해요.</span>
      <TrackedLink enabled={sponsor.measurementEnabled} event="sponsor_click" entityId={sponsor.id} slot={sponsor.slot_key}
        href={ctaUrl} target="_blank" rel="sponsored noopener noreferrer" className="rk-btn rk-btn--secondary">
        {sponsor.cta_label || '광고 자세히 보기'} ↗ <span className="sr-only">(외부 사이트, 새 탭)</span>
      </TrackedLink>
    </aside>
  );
}
