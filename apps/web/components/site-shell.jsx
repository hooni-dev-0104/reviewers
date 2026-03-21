import Link from 'next/link';

export function SiteShell({ children, visitorWidget, campaignCount }) {
  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <Link href="/" className="brand-mark">
            reviewers
          </Link>
          <p>지원 전에 필요한 정보만 빠르게</p>
        </div>
        <nav>
          <Link href="/">탐색</Link>
          <Link href="/trust">신뢰 기준</Link>
          <a href="https://reviewers-ten.vercel.app" target="_blank" rel="noreferrer">
            배포 도메인
          </a>
        </nav>
      </header>

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
