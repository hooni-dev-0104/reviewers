export function cn(...values) {
  return values.flat().filter(Boolean).join(' ');
}

export const containerClass = 'mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8';
export const shellStackClass = 'flex min-h-screen flex-col gap-6 pb-10 sm:gap-8 sm:pb-12';
export const surfaceClass = 'rounded-[32px] border border-slate-200/80 bg-white/88 shadow-[0_20px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-950/5 backdrop-blur';
export const softSurfaceClass = 'rounded-[28px] border border-slate-200/70 bg-slate-50/90 shadow-[0_16px_40px_rgba(15,23,42,0.05)] ring-1 ring-slate-950/5';
export const sectionGapClass = 'space-y-6 sm:space-y-8';
export const headingEyebrowClass = 'text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600';
export const headingTitleClass = 'text-[32px] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[44px] sm:leading-[1.02]';
export const headingDescriptionClass = 'max-w-3xl text-sm leading-7 text-slate-600 sm:text-base';
export const cardTitleClass = 'text-lg font-semibold tracking-[-0.03em] text-slate-950 sm:text-xl';
export const cardDescriptionClass = 'text-sm leading-6 text-slate-600';
export const inputClass = 'h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100';
export const selectClass = inputClass;
export const textareaClass = 'min-h-[176px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100';
export const pillBaseClass = 'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition';

const buttonBase = 'inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50';

const buttonVariants = {
  primary: 'border border-indigo-600 bg-indigo-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.24)] hover:-translate-y-0.5 hover:bg-indigo-500 focus-visible:ring-indigo-200',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-200',
  subtle: 'border border-indigo-100 bg-indigo-50 text-indigo-700 hover:-translate-y-0.5 hover:bg-indigo-100 focus-visible:ring-indigo-100',
  ghost: 'border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-200',
  danger: 'border border-rose-200 bg-rose-50 text-rose-700 hover:-translate-y-0.5 hover:bg-rose-100 focus-visible:ring-rose-100'
};

const buttonSizes = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-sm',
  lg: 'h-14 px-6 text-sm sm:text-base'
};

export function getButtonClasses({ variant = 'primary', size = 'md', fullWidth = false, className } = {}) {
  return cn(buttonBase, buttonVariants[variant] || buttonVariants.primary, buttonSizes[size] || buttonSizes.md, fullWidth ? 'w-full' : '', className);
}

export function getBadgeClasses(tone = 'default') {
  const tones = {
    default: 'border-slate-200 bg-white text-slate-600',
    brand: 'border-indigo-100 bg-indigo-50 text-indigo-700',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    warn: 'border-amber-100 bg-amber-50 text-amber-700',
    danger: 'border-rose-100 bg-rose-50 text-rose-700',
    dark: 'border-slate-900/10 bg-slate-900 text-white',
    info: 'border-cyan-100 bg-cyan-50 text-cyan-700'
  };

  return cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium', tones[tone] || tones.default);
}
