export function Card({ children, interactive = false, pad = false, as: Tag = 'div', className = '', ...rest }) {
  const cls = [
    'rk-card',
    interactive ? 'rk-card--interactive' : '',
    pad ? 'rk-card--pad' : '',
    className
  ].filter(Boolean).join(' ');

  return <Tag className={cls} {...rest}>{children}</Tag>;
}
