import { Icon } from '@/components/ui/icon';

export function FilterChip({ children, selected = false, removable = false, className = '', ...rest }) {
  const cls = ['rk-chip', selected ? 'is-selected' : '', className].filter(Boolean).join(' ');

  return (
    <button type="button" className={cls} {...rest}>
      {children}
      {removable ? <span className="rk-chip__x"><Icon name="x" size={13} /></span> : null}
    </button>
  );
}
