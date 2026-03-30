import { BoardPostList } from '@/components/board-post-list';
import { ButtonLink, PageHero, Surface } from '@/components/ui-kit';
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
      <PageHero
        eyebrow="Community feedback"
        title="문의, 요청, 사용 후기를 같은 톤으로 정리한 게시판"
        description="과한 장식 대신 읽기 쉬운 카드와 분명한 공개 상태 배지로 게시글 구조를 정리했습니다."
        actions={[
          <ButtonLink key="write" href="/board/new" variant="primary" size="lg">글 남기기</ButtonLink>,
          <ButtonLink key="list" href="/" variant="secondary" size="lg">캠페인 보기</ButtonLink>
        ]}
        stats={[
          { label: '전체 글', value: posts.length.toLocaleString('ko-KR'), hint: '최근 남겨진 의견 포함' },
          { label: '공개 필터', value: visibility === 'all' ? '전체' : visibility === 'public' ? '공개' : '비공개', hint: '현재 선택된 범위' },
          { label: '응답 흐름', value: '간결한 읽기', hint: '모바일에서도 읽기 쉬운 구조' }
        ]}
      />

      <Surface className="space-y-6 p-5 sm:p-8">
        <div className="inline-flex flex-wrap rounded-full border border-slate-200 bg-slate-50 p-2">
          {[
            ['all', '전체'],
            ['public', '공개'],
            ['private', '비공개']
          ].map(([value, label]) => {
            const active = visibility === value;
            return (
              <ButtonLink
                key={value}
                href={value === 'all' ? '/board' : `/board?visibility=${value}`}
                variant={active ? 'primary' : 'ghost'}
                size="sm"
              >
                {label}
              </ButtonLink>
            );
          })}
        </div>
        <BoardPostList posts={posts} />
      </Surface>
    </SiteShell>
  );
}
