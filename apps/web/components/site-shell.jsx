import Link from 'next/link';

export function SiteShell({ children, visitorWidget, campaignCount }) {
  return (
    <div className="page-shell">
      <div className="topbar-shell">
        <header className="topbar">
          <Link href="/" className="brand-mark">
            리뷰콕
          </Link>
          {visitorWidget}
        </header>
      </div>

      <main>{children}</main>

    </div>
  );
}
