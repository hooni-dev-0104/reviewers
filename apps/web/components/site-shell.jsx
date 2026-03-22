import Link from 'next/link';

import { AccountStatus } from '@/components/account-status';

export function SiteShell({ children, visitorWidget, campaignCount }) {
  const showOps = Boolean(process.env.OPS_DASHBOARD_KEY);

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
            <Link href="/account">계정</Link>
            <Link href="/saved">저장</Link>
            <Link href="/reminders">리마인드</Link>
            <Link href="/trust">확인 기준</Link>
            {showOps ? <Link href="/ops">운영</Link> : null}
          </nav>
          <AccountStatus />
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
