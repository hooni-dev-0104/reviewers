import { ButtonLink, EmptyState, PageHero, Surface } from '@/components/ui-kit';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { getReminderItems } from '@/lib/reminders';
import { formatDeadline, formatRegion } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function RemindersPage() {
  const [counts, campaignCount, user] = await Promise.all([getVisitorCounts(), getCampaignCount(), getCurrentUser()]);
  const items = user ? await getReminderItems(user.id) : [];

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <PageHero
        eyebrow="Reminder workflow"
        title="다가오는 마감을 놓치지 않도록 리마인드를 정리해 두세요"
        description="알림 시점을 한눈에 보여주고 바로 상세나 원문으로 이동할 수 있게 구성했습니다."
        stats={[
          { label: '리마인드 단계', value: '3 / 24 / 72h', hint: '설정 가능한 알림 시점' },
          { label: '행동 흐름', value: '확인 → 이동', hint: '다시 탐색하지 않아도 됨' },
          { label: '모바일 UX', value: '세로 카드', hint: '짧은 재확인 흐름' }
        ]}
      />
      {!user ? (
        <EmptyState
          title="리마인드를 보려면 로그인해 주세요"
          actions={[<ButtonLink key="login" href="/account?next=/reminders" variant="primary">로그인하러 가기</ButtonLink>]}
        />
      ) : !items.length ? (
        <EmptyState
          title="설정된 리마인드가 없어요"
          description="상세 페이지에서 3시간, 24시간, 72시간 전 리마인드를 설정할 수 있어요."
        />
      ) : (
        <section className="grid gap-4">
          {items.map((item) => (
            <Surface key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{item.campaign.title}</h3>
                <p className="text-sm leading-6 text-slate-600">{formatRegion(item.campaign)} · {formatDeadline(item.campaign.apply_deadline)} · {item.remind_before_hours}시간 전</p>
              </div>
              <div className="flex flex-col gap-3 sm:min-w-[220px]">
                <ButtonLink href={`/campaign/${item.campaign.id}`} variant="primary">상세 보기</ButtonLink>
                <a href={item.campaign.original_url} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50">
                  원문 이동
                </a>
              </div>
            </Surface>
          ))}
        </section>
      )}
    </SiteShell>
  );
}
