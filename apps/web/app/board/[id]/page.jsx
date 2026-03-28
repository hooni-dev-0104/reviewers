import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PrivatePostGate } from '@/components/private-post-gate';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { formatBoardDate, getBoardPostForPublic } from '@/lib/board';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function BoardDetailPage({ params }) {
  const { id } = await params;
  const [counts, campaignCount, post] = await Promise.all([
    getVisitorCounts(),
    getCampaignCount(),
    getBoardPostForPublic(id)
  ]);

  if (!post) {
    notFound();
  }

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="trust-page saved-page">
        <span className="eyebrow">게시판</span>
        <h1>{post.title}</h1>
        <div className="chip-row compact-row">
          <span>{post.visibility === 'private' ? '비공개 글' : '공개 글'}</span>
          <span>{post.nickname}</span>
          <span>{formatBoardDate(post.created_at)}</span>
        </div>
        <div className="hero-actions">
          <Link href="/board" className="ghost-link">목록으로</Link>
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

          {post.visibility === 'public' ? (
            <article className="info-panel">
              <h2>본문</h2>
              <div className="board-body">{post.body}</div>
            </article>
          ) : (
            <PrivatePostGate postId={post.id} post={post} />
          )}
        </section>
      </section>
    </SiteShell>
  );
}
