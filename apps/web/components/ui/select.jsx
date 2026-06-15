import { Icon } from '@/components/ui/icon';

export function Select({ children, label, id, className = '', ...rest }) {
  const control = (
    <div className="rk-select-wrap">
      <select id={id} className="rk-select" {...rest}>{children}</select>
      <Icon name="chevron-down" size={18} />
    </div>
  );

  if (!label) {
    return <div className={className}>{control}</div>;
  }

  return (
    <label className={['rk-field', className].filter(Boolean).join(' ')} htmlFor={id}>
      <span className="rk-field__label">{label}</span>
      {control}
    </label>
  );
}
