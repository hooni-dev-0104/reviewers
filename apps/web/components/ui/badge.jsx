import { Icon } from '@/components/ui/icon';

const ICON_BY_TONE = {
  urgent: 'clock',
  danger: 'clock',
  trust: 'shield-check',
  success: 'check-circle',
  ok: 'check-circle',
  warning: 'alert-triangle',
  warn: 'alert-triangle',
  sponsor: 'sparkles',
  neutral: null,
  muted: null,
  accent: 'clock'
};

const TONE_CLASS = {
  danger: 'urgent',
  warn: 'warning',
  ok: 'success',
  muted: 'neutral',
  accent: 'trust'
};

export function Badge({ children, tone = 'neutral', solid = false, dot = false, icon, showIcon = false, className = '', ...rest }) {
  const visualTone = TONE_CLASS[tone] || tone;
  const resolvedIcon = icon || (showIcon ? ICON_BY_TONE[tone] : null);
  const cls = ['rk-badge', `rk-badge--${visualTone}`, solid ? 'rk-badge--solid' : '', className].filter(Boolean).join(' ');

  return (
    <span className={cls} {...rest}>
      {dot ? <span className="rk-badge__dot" /> : null}
      {resolvedIcon ? <Icon name={resolvedIcon} size={12} /> : null}
      {children}
    </span>
  );
}
