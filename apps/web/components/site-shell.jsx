import Link from 'next/link';
import { TopTabs } from '@/components/top-tabs';

export function SiteShell({ children, visitorWidget, campaignCount }) {
  return (
    <div className="page-shell">
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

      <main>{children}</main>

    </div>
  );
}
