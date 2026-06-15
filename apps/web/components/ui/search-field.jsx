import { Icon } from '@/components/ui/icon';

export function SearchField({ label, id, className = '', ...rest }) {
  const control = (
    <div className="rk-search">
      <Icon name="search" size={18} />
      <input id={id} className="rk-input" type="search" {...rest} />
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
