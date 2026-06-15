import { Icon } from '@/components/ui/icon';

export function Tag({ children, icon, plain = false, className = '', ...rest }) {
  const cls = ['rk-tag', plain ? 'rk-tag--plain' : '', className].filter(Boolean).join(' ');

  return (
    <span className={cls} {...rest}>
      {icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </span>
  );
}
