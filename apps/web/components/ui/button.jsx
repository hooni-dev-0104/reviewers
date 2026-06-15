import Link from 'next/link';

import { Icon } from '@/components/ui/icon';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  iconRight,
  className = '',
  type = 'button',
  ...rest
}) {
  const cls = [
    'rk-btn',
    `rk-btn--${variant}`,
    `rk-btn--${size}`,
    block ? 'rk-btn--block' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={cls} {...rest}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null}
      {children ? <span>{children}</span> : null}
      {iconRight ? <Icon name={iconRight} size={size === 'sm' ? 16 : 18} /> : null}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  iconRight,
  className = '',
  ...rest
}) {
  const cls = [
    'rk-btn',
    `rk-btn--${variant}`,
    `rk-btn--${size}`,
    block ? 'rk-btn--block' : '',
    className
  ].filter(Boolean).join(' ');
  const content = (
    <>
      {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null}
      {children ? <span>{children}</span> : null}
      {iconRight ? <Icon name={iconRight} size={size === 'sm' ? 16 : 18} /> : null}
    </>
  );

  if (typeof href === 'string' && href.startsWith('/')) {
    return <Link href={href} className={cls} {...rest}>{content}</Link>;
  }

  return <a href={href} className={cls} {...rest}>{content}</a>;
}
