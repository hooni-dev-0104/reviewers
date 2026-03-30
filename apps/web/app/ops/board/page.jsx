import { notFound } from 'next/navigation';

import { BoardPostList } from '@/components/board-post-list';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { isOpsAuthenticated } from '@/lib/ops';
import { listBoardPosts } from '@/lib/board';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function OpsBoardPage() {
  const authenticated = await isOpsAuthenticated();
  if (!authenticated) {
    notFound();
  }

  const [counts, campaignCount, posts] = await Promise.all([
    getVisitorCounts(),
    getCampaignCount(),
    listBoardPosts({ visibility: 'all' })
  ]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="trust-page saved-page">
        <span className="eyebrow">Ops 게시판</span>
        <h1>관리자 전용 게시글 열람</h1>
        <p>비공개 글도 본문까지 바로 확인할 수 있는 숨겨진 관리자 화면입니다.</p>
        <BoardPostList posts={posts} basePath="/ops/board" showDelete />
      </section>
    </SiteShell>
  );
}
