export function Skeleton({ className = '', style, ...rest }) {
  return <span className={['rk-skeleton', className].filter(Boolean).join(' ')} style={style} {...rest} />;
}
