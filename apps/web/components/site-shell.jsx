import Link from 'next/link';

export function SiteShell({ children, visitorWidget, campaignCount }) {
  return (
    <div className="page-shell">
      <div className="topbar-shell">
        <header className="topbar">
          <div>
            <Link href="/" className="brand-mark">
              리뷰콕
            </Link>
            <p>혜택·마감 먼저 보는 체험단 모음</p>
          </div>
          <nav>
            <Link href="/">탐색</Link>
          </nav>
        </header>
      </div>

      <main>{children}</main>

      <footer className="footer-bar">
        <div>
          <strong>{campaignCount.toLocaleString('ko-KR')}</strong>
          <span>노출 중 캠페인</span>
        </div>
        {visitorWidget}
      </footer>
    </div>
  );
}
