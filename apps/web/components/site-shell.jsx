import Link from 'next/link';

export function SiteShell({ children, visitorWidget, campaignCount }) {
  return (
    <div className="page-shell">
      <div className="topbar-shell">
        <header className="topbar">
          <Link href="/" className="brand-mark">
            리뷰콕
          </Link>
        </header>
        {visitorWidget ? <div className="topbar-meta">{visitorWidget}</div> : null}
      </div>

      <main>{children}</main>

      <footer className="footer-bar footer-bar-compact">
        <div>
          <strong>{campaignCount.toLocaleString('ko-KR')}</strong>
          <span>노출 중 캠페인</span>
        </div>
      </footer>
    </div>
  );
}
