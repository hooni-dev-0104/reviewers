import Link from 'next/link';
import { BottomNav } from '@/components/bottom-nav';
import { TopTabs } from '@/components/top-tabs';

export function SiteShell({ children, visitorWidget, campaignCount }) {
  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <div className="topbar-shell">
        <header className="topbar">
          <div className="topbar-brand-group">
            <Link href="/" className="brand-mark">
              리뷰콕
            </Link>
            <TopTabs />
          </div>
          <div className="topbar-side">{visitorWidget}</div>
        </header>
      </div>

      <main id="main-content">{children}</main>
      <footer className="site-footer"><span>리뷰콕 · 무료 캠페인 탐색</span><Link href="/trust">출처·광고·개인정보 안내</Link></footer>

      <div className="rk-nav-wrap">
        <BottomNav />
      </div>
    </div>
  );
}
