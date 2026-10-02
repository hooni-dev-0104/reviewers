'use client';
import { sendEvent } from '@/lib/event-client';
export function TrackedLink({ enabled = false, event, entityId, slot, children, ...props }) {
  function track(e) { if (enabled && (e.type === 'click' || e.button === 1)) sendEvent(event, entityId, slot); }
  return <a {...props} onClick={track} onAuxClick={track}>{children}</a>;
}
