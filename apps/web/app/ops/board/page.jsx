import { notFound } from 'next/navigation';

import { BoardPostList } from '@/components/board-post-list';
import { PageHero } from '@/components/ui-kit';
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
      <PageHero
        eyebrow="Ops board"
        title="관리자 전용 게시글 열람"
        description="비공개 글도 본문까지 바로 확인할 수 있는 관리자 전용 화면입니다."
        stats={[
          { label: '전체 글', value: posts.length.toLocaleString('ko-KR'), hint: '운영 검토 대상' },
          { label: '권한', value: '관리자', hint: '비공개 본문 확인 가능' },
          { label: '행동', value: '열람 + 삭제', hint: '운영 대응 흐름' }
        ]}
      />
      <BoardPostList posts={posts} basePath="/ops/board" showDelete />
    </SiteShell>
  );
}
