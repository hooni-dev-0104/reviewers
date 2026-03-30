'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/ui';

const tabs = [
  { href: '/', label: '목록', match: (pathname) => pathname === '/' },
  { href: '/map', label: '체험단 지도', match: (pathname) => pathname === '/map' },
  { href: '/board', label: '게시판', match: (pathname) => pathname.startsWith('/board') }
];

export function TopTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="inline-flex w-full flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-2 sm:w-auto"
      aria-label="주요 탐색 탭"
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition',
              active
                ? 'bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                : 'text-slate-600 hover:bg-white hover:text-slate-950'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
