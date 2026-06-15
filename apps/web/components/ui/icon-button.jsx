import { Icon } from '@/components/ui/icon';

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  active = false,
  filled = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const cls = [
    'rk-iconbtn',
    `rk-iconbtn--${variant}`,
    `rk-iconbtn--${size}`,
    active ? 'is-active' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={cls} aria-label={label} aria-pressed={active || undefined} {...rest}>
      <Icon name={icon} size={size === 'sm' ? 18 : 20} filled={filled || active} />
    </button>
  );
}
