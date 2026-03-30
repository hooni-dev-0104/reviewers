import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="trust-page">
        <span className="eyebrow">404</span>
        <h1>찾으려던 캠페인을 못 찾았어요.</h1>
        <p>캠페인이 만료되었거나, 링크가 바뀌었을 수 있어요. 최신 목록에서 다시 탐색해보세요.</p>
        <div className="hero-actions">
          <Link href="/">탐색으로 돌아가기</Link>
        </div>
      </section>
    </main>
  );
}
