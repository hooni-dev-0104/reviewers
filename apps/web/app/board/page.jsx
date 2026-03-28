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
      <section className="trust-page saved-page">
        <div className="section-headline board-page-head">
          <div>
            <span className="eyebrow">게시판</span>
            <h1>편하게 의견을 남겨주세요.</h1>
            <p>요구사항, 문의사항, 사용 중 느낀 점은 물론이고 작은 응원 한마디도 좋아요.</p>
          </div>
          <Link href="/board/new" className="board-write-link">글쓰기</Link>
        </div>

        <div className="hero-actions">
          <Link href="/board?visibility=all" className={visibility === 'all' ? 'ghost-link' : ''}>전체</Link>
          <Link href="/board?visibility=public" className={visibility === 'public' ? 'ghost-link' : ''}>공개</Link>
          <Link href="/board?visibility=private" className={visibility === 'private' ? 'ghost-link' : ''}>비공개</Link>
        </div>

        <BoardPostList posts={posts} />
      </section>
    </SiteShell>
  );
}
