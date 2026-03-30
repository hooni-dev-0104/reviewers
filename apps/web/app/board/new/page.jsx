import { BoardPostForm } from '@/components/board-post-form';
import { ButtonLink, PageHero, Surface } from '@/components/ui-kit';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function BoardNewPage() {
  const [counts, campaignCount] = await Promise.all([getVisitorCounts(), getCampaignCount()]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <PageHero
        eyebrow="Write feedback"
        title="생각난 내용을 바로 남길 수 있게 작성 경험을 단순화했습니다"
        description="입력 필드 계층을 줄이고 시선 흐름이 끊기지 않도록 카드형 작성 화면으로 재구성했습니다."
        actions={[
          <ButtonLink key="board" href="/board" variant="secondary" size="lg">목록으로</ButtonLink>
        ]}
        stats={[
          { label: '작성 유형', value: '공개 / 비공개', hint: '둘 다 같은 흐름으로 작성' },
          { label: '입력 구조', value: '핵심 4개', hint: '닉네임, 상태, 제목, 본문' },
          { label: '모바일 UX', value: '세로 우선', hint: '한 손 입력 흐름 최적화' }
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <BoardPostForm />
        <Surface className="space-y-4 p-6 sm:p-8">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">작성 전에 확인해 주세요</span>
            <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">더 빠른 확인을 위한 작성 가이드</h2>
          </div>
          <ul className="space-y-3 text-sm leading-7 text-slate-600">
            <li>• 제목은 한눈에 이해되게 짧고 분명하게 적어주세요.</li>
            <li>• 오류 제보나 요청은 상황을 함께 적어주면 확인이 빨라져요.</li>
            <li>• 민감한 내용은 비공개 글로 남기면 더 안전하게 전달할 수 있어요.</li>
          </ul>
        </Surface>
      </section>
    </SiteShell>
  );
}
