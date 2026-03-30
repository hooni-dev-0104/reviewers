import Link from 'next/link';

import { TopTabs } from '@/components/top-tabs';
import { ButtonLink } from '@/components/ui-kit';
import { formatCount } from '@/lib/format';
import { cn, containerClass, shellStackClass, surfaceClass } from '@/lib/ui';

export function SiteShell({ children, visitorWidget, campaignCount }) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.18),transparent_48%)]" aria-hidden="true" />
      <div className={cn(containerClass, shellStackClass, 'relative z-10 pt-4 sm:pt-6')}>
        <header className={cn(surfaceClass, 'sticky top-4 z-30 p-4 sm:p-6')}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                  Reviewkok
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  활성 캠페인 {formatCount(campaignCount)}개
                </span>
              </div>

              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-8">
                <div className="space-y-2">
                  <Link href="/" className="text-[28px] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[32px]">
                    리뷰콕
                  </Link>
                  <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                    혜택, 마감, 지역을 한 화면에 정리해 더 빠르게 비교하고 선택하는 체험단 탐색 플랫폼.
                  </p>
                </div>
                <TopTabs />
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              {visitorWidget}
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/saved" variant="secondary" size="sm">
                  저장한 캠페인
                </ButtonLink>
                <ButtonLink href="/reminders" variant="secondary" size="sm">
                  리마인드
                </ButtonLink>
                <ButtonLink href="/account" variant="primary" size="sm">
                  계정
                </ButtonLink>
              </div>
            </div>
          </div>
        </header>

        <main className="space-y-6 sm:space-y-8">{children}</main>

        <footer className={cn(surfaceClass, 'p-5 sm:p-6')}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <strong className="block text-base font-semibold tracking-[-0.03em] text-slate-950">
                체험단 탐색을 더 빠르고 명확하게.
              </strong>
              <p className="text-sm leading-6 text-slate-600">
                일관된 정보 구조와 모바일 우선 UX로 오늘 지원할 캠페인을 빠르게 고르도록 설계했습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <Link href="/">목록</Link>
              <Link href="/map">지도</Link>
              <Link href="/board">게시판</Link>
              <Link href="/account">계정</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
