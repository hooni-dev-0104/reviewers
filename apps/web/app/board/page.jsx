import Link from 'next/link';

import { BoardPostList } from '@/components/board-post-list';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { listBoardPosts } from '@/lib/board';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function BoardPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const visibility = ['public', 'private'].includes(resolvedSearchParams?.visibility) ? resolvedSearchParams.visibility : 'all';
  const [counts, campaignCount, posts] = await Promise.all([
    getVisitorCounts(),
    getCampaignCount(),
    listBoardPosts({ visibility })
  ]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="trust-page saved-page board-page-shell">
        <div className="board-hero-card">
          <div className="board-hero-copy">
            <span className="eyebrow">게시판</span>
            <h1 className="board-hero-title">편하게 의견을 남겨주세요.</h1>
            <p className="board-hero-description">요구사항, 문의, 사용 후기를 편하게 남겨주세요. 짧은 응원 한마디도 좋아요.</p>
            <div className="board-topic-chips" aria-label="게시판에서 남길 수 있는 이야기">
              <span>요청사항</span>
              <span>문의</span>
              <span>응원 한마디</span>
            </div>
          </div>
          <div className="board-hero-side">
            <Link href="/board/new" className="board-write-link">글 남기기</Link>
            <p className="board-hero-helper">닉네임만 적어도 되고, 비공개 글도 가능해요.</p>
          </div>
        </div>

        <div className="board-filter-bar" role="tablist" aria-label="게시글 공개 범위 필터">
          <Link
            href="/board?visibility=all"
            className={`board-filter-link${visibility === 'all' ? ' is-active' : ''}`}
            aria-current={visibility === 'all' ? 'page' : undefined}
          >
            전체
          </Link>
          <Link
            href="/board?visibility=public"
            className={`board-filter-link${visibility === 'public' ? ' is-active' : ''}`}
            aria-current={visibility === 'public' ? 'page' : undefined}
          >
            공개
          </Link>
          <Link
            href="/board?visibility=private"
            className={`board-filter-link${visibility === 'private' ? ' is-active' : ''}`}
            aria-current={visibility === 'private' ? 'page' : undefined}
          >
            비공개
          </Link>
        </div>

        <BoardPostList posts={posts} />
      </section>
    </SiteShell>
  );
}
