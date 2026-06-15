export function SegmentedControl({ options, value, onChange, className = '', ...rest }) {
  return (
    <div className={['rk-segmented', className].filter(Boolean).join(' ')} role="tablist" {...rest}>
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        return (
          <button
            key={optionValue}
            type="button"
            role="tab"
            aria-selected={value === optionValue}
            className={['rk-segmented__item', value === optionValue ? 'is-active' : ''].filter(Boolean).join(' ')}
            onClick={() => onChange?.(optionValue)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
