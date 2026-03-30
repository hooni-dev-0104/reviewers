import { PageHero, EmptyState, Surface, Button } from '@/components/ui-kit';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';
import { getOpsSnapshot, isOpsAuthenticated } from '@/lib/ops';
import { inputClass } from '@/lib/ui';

export const dynamic = 'force-dynamic';

export default async function OpsPage() {
  const [counts, campaignCount, authenticated] = await Promise.all([getVisitorCounts(), getCampaignCount(), isOpsAuthenticated()]);
  const snapshot = authenticated ? await getOpsSnapshot() : null;
  const opsEnabled = Boolean(process.env.OPS_DASHBOARD_KEY);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <PageHero
        eyebrow="Ops dashboard"
        title="운영 상태를 한 화면에서 빠르게 확인하는 관리자 대시보드"
        description="지표, 작업 상태, 소스 건강도를 카드 단위로 정리해 운영 흐름도 같은 디자인 시스템으로 맞췄습니다."
        stats={[
          { label: '활성 캠페인', value: snapshot ? snapshot.activeCampaigns.toLocaleString('ko-KR') : '-', hint: '현재 공개 중인 후보' },
          { label: '오늘 방문', value: snapshot ? snapshot.visitorsToday.toLocaleString('ko-KR') : '-', hint: '실시간 유입' },
          { label: '회원 수', value: snapshot ? snapshot.userCount.toLocaleString('ko-KR') : '-', hint: '계정 기반 사용자' }
        ]}
      />

      {!opsEnabled ? (
        <EmptyState
          title="운영 세션 설정이 아직 준비되지 않았어요"
          description="세션 서명용 환경값이 있어야 보호된 운영 대시보드를 사용할 수 있어요."
        />
      ) : !authenticated ? (
        <Surface as="form" className="grid gap-4 p-6 sm:p-8" action="/api/ops/login" method="post">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">관리자 비밀번호</span>
            <input id="opsKey" name="opsKey" type="password" placeholder="등록된 관리자 비밀번호" required className={inputClass} />
          </label>
          <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">대시보드 열기</Button>
        </Surface>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['활성 캠페인', snapshot.activeCampaigns],
              ['오늘 방문자', snapshot.visitorsToday],
              ['전체 방문자', snapshot.visitorsTotal],
              ['회원 수', snapshot.userCount],
              ['저장 수', snapshot.savedCount],
              ['리마인드 수', snapshot.reminderCount]
            ].map(([label, value]) => (
              <Surface key={label} className="space-y-2 p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
                <strong className="block text-[28px] font-semibold tracking-[-0.04em] text-slate-950">{value.toLocaleString('ko-KR')}</strong>
              </Surface>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <OpsPanel title="최근 크롤링 작업" items={snapshot.recentJobs.map((job) => ({ title: `${job.source?.name || '미상 소스'} · ${job.job_status}`, meta: new Date(job.created_at).toLocaleString('ko-KR'), detail: `fetched ${job.fetched_count} / inserted ${job.inserted_count}` }))} />
            <OpsPanel title="소스별 수집 현황" items={snapshot.sourceStats.map((source) => ({ title: source.name, meta: source.slug, detail: `active ${source.activeCampaigns} / exact ${source.exactLocationCount} / latlng ${source.latLngCount}` }))} />
            <OpsPanel title="광고 슬롯" items={snapshot.sponsors.length ? snapshot.sponsors.map((slot) => ({ title: slot.slot_key, meta: slot.title, detail: slot.is_active ? '활성' : '비활성' })) : [{ title: '등록된 스폰서 슬롯이 없어요.', meta: '', detail: '' }]} />
          </section>

          <form action="/api/ops/logout" method="post">
            <Button type="submit" variant="secondary" size="md">운영 세션 종료</Button>
          </form>
        </div>
      )}
    </SiteShell>
  );
}

function OpsPanel({ title, items }) {
  return (
    <Surface className="space-y-4 p-5 sm:p-6">
      <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">{title}</h2>
      <div className="grid gap-3">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <strong className="block text-slate-950">{item.title}</strong>
            {item.meta ? <span className="block">{item.meta}</span> : null}
            {item.detail ? <span className="block">{item.detail}</span> : null}
          </div>
        ))}
      </div>
    </Surface>
  );
}
