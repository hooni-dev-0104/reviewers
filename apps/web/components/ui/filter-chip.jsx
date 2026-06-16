import { Icon } from '@/components/ui/icon';

export function FilterChip({ children, icon, selected = false, removable = false, className = '', ...rest }) {
  const cls = ['rk-chip', selected ? 'is-selected' : '', className].filter(Boolean).join(' ');

  return (
    <button type="button" className={cls} aria-pressed={removable ? undefined : selected} {...rest}>
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
      {removable ? <span className="rk-chip__x"><Icon name="x" size={13} /></span> : null}
    </button>
  );
}
