import { Icon } from '@/components/ui/icon';

export function EmptyState({ icon = 'search', title, body, action, className = '', as: Tag = 'section', ...rest }) {
  return (
    <Tag className={['rk-empty', className].filter(Boolean).join(' ')} {...rest}>
      <span className="rk-empty__icon"><Icon name={icon} size={22} /></span>
      {title ? <div className="rk-empty__title">{title}</div> : null}
      {body ? <div className="rk-empty__body">{body}</div> : null}
      {action ? <div className="rk-empty__action">{action}</div> : null}
    </Tag>
  );
}
