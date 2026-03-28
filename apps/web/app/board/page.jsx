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
        <div className="section-headline">
          <div>
            <span className="eyebrow">게시판</span>
            <h1>공개 글과 비공개 글을 모두 남길 수 있어요.</h1>
            <p>비공개 글도 제목은 공개되고, 본문은 작성한 닉네임과 비밀번호로만 확인할 수 있어요.</p>
          </div>
          <Link href="/board/new">글쓰기</Link>
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
