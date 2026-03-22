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
            <p>혜택과 마감부터 먼저 보는 체험단 찾기</p>
          </div>
          <nav>
            <Link href="/">탐색</Link>
            <Link href="/trust">확인 기준</Link>
          </nav>
        </header>
      </div>

      <main>{children}</main>

      <footer className="footer-bar">
        <div>
          <strong>{campaignCount.toLocaleString('ko-KR')}</strong>
          <span>현재 노출 중 캠페인</span>
        </div>
        {visitorWidget}
      </footer>
    </div>
  );
}
