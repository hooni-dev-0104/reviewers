import Link from 'next/link';

import {
  cardDescriptionClass,
  cardTitleClass,
  cn,
  getBadgeClasses,
  getButtonClasses,
  headingDescriptionClass,
  headingEyebrowClass,
  headingTitleClass,
  softSurfaceClass,
  surfaceClass
} from '@/lib/ui';

export function ButtonLink({ href, variant = 'primary', size = 'md', className, children, ...props }) {
  return (
    <Link href={href} className={getButtonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}

export function Button({ type = 'button', variant = 'primary', size = 'md', className, children, ...props }) {
  return (
    <button type={type} className={getButtonClasses({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}

export function Badge({ tone = 'default', className, children }) {
  return <span className={cn(getBadgeClasses(tone), className)}>{children}</span>;
}

export function Surface({ as: Component = 'section', className, children, ...props }) {
  return (
    <Component className={cn(surfaceClass, className)} {...props}>
      {children}
    </Component>
  );
}

export function SoftSurface({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component className={cn(softSurfaceClass, className)} {...props}>
      {children}
    </Component>
  );
}

export function SectionHeading({ eyebrow, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-3">
        {eyebrow ? <span className={headingEyebrowClass}>{eyebrow}</span> : null}
        <div className="space-y-2">
          <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[32px]">{title}</h2>
          {description ? <p className={headingDescriptionClass}>{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageHero({ eyebrow, title, description, actions, stats = [], aside, className }) {
  return (
    <Surface className={cn('grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] lg:items-start', className)}>
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-4">
          {eyebrow ? <span className={headingEyebrowClass}>{eyebrow}</span> : null}
          <div className="space-y-4">
            <h1 className={headingTitleClass}>{title}</h1>
            {description ? <p className={headingDescriptionClass}>{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-4">{actions}</div> : null}
        {stats.length ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <SoftSurface key={stat.label} className="space-y-2 p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</span>
                <strong className="block text-[28px] font-semibold tracking-[-0.04em] text-slate-950">{stat.value}</strong>
                {stat.hint ? <p className="text-sm leading-6 text-slate-500">{stat.hint}</p> : null}
              </SoftSurface>
            ))}
          </div>
        ) : null}
      </div>
      {aside ? (
        <SoftSurface className="space-y-5 p-6">
          {aside}
        </SoftSurface>
      ) : null}
    </Surface>
  );
}

export function EmptyState({ title, description, actions, className }) {
  return (
    <Surface className={cn('space-y-4 p-6 text-center sm:p-8', className)}>
      <div className="space-y-2">
        <h3 className={cardTitleClass}>{title}</h3>
        {description ? <p className={cardDescriptionClass}>{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap justify-center gap-4">{actions}</div> : null}
    </Surface>
  );
}
