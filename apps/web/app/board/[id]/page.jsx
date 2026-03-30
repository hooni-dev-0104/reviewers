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
      <section className="trust-page saved-page board-page-shell board-subpage-shell">
        <div className="board-hero-card board-detail-hero-card">
          <div className="board-hero-copy board-detail-copy">
            <span className="eyebrow">게시판</span>
            <h1 className="board-detail-title">{post.title}</h1>
            <p className="board-detail-summary">
              {post.visibility === 'private'
                ? '비공개 글이라 작성한 닉네임과 비밀번호를 입력해야 본문을 확인할 수 있어요.'
                : '공개 글이라 누구나 바로 내용을 읽을 수 있어요.'}
            </p>
            <div className="board-detail-meta">
              <span className={`badge ${post.visibility === 'private' ? 'badge-warn' : 'badge-ok'}`}>
                {post.visibility === 'private' ? '비공개 글' : '공개 글'}
              </span>
              <span>{post.nickname}</span>
              <span>{formatBoardDate(post.created_at)}</span>
            </div>
          </div>
          <div className="board-hero-side board-detail-side">
            <Link href="/board" className="board-secondary-link">목록으로</Link>
            <div className="board-inline-note">
              <strong>작성 정보</strong>
              <span>{post.nickname} · {formatBoardDate(post.created_at)}</span>
            </div>
          </div>
        </div>

        <section className="detail-grid board-detail-grid">
          <article className="info-panel board-meta-panel">
            <h2>글 정보</h2>
            <dl className="board-meta-list">
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
            <article className="info-panel board-detail-body-card">
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
