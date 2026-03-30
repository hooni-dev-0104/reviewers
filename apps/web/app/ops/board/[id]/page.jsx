import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { formatBoardDate, getBoardPostForOps } from '@/lib/board';
import { isOpsAuthenticated } from '@/lib/ops';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function OpsBoardDetailPage({ params }) {
  const authenticated = await isOpsAuthenticated();
  if (!authenticated) {
    notFound();
  }

  const { id } = await params;
  const [counts, campaignCount, post] = await Promise.all([
    getVisitorCounts(),
    getCampaignCount(),
    getBoardPostForOps(id)
  ]);

  if (!post) {
    notFound();
  }

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="trust-page saved-page">
        <span className="eyebrow">Ops 게시판</span>
        <h1>{post.title}</h1>
        <div className="chip-row compact-row">
          <span>{post.visibility === 'private' ? '비공개 글' : '공개 글'}</span>
          <span>관리자 열람</span>
          <span>{post.nickname}</span>
          <span>{formatBoardDate(post.created_at)}</span>
        </div>
        <div className="hero-actions">
          <Link href="/ops/board" className="ghost-link">목록으로</Link>
          <form action={`/api/ops/board/${post.id}/delete`} method="post">
            <button type="submit" className="board-delete-button">삭제</button>
          </form>
        </div>

        <section className="detail-grid">
          <article className="info-panel">
            <h2>글 정보</h2>
            <dl>
              <div>
                <dt>닉네임</dt>
                <dd>{post.nickname}</dd>
              </div>
              <div>
                <dt>작성일</dt>
                <dd>{formatBoardDate(post.created_at)}</dd>
              </div>
              <div>
                <dt>공개 여부</dt>
                <dd>{post.visibility === 'private' ? '비공개' : '공개'}</dd>
              </div>
            </dl>
          </article>
          <article className="info-panel">
            <h2>본문</h2>
            <div className="board-body">{post.body}</div>
          </article>
        </section>
      </section>
    </SiteShell>
  );
}
