import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';
import { getOpsSnapshot, isOpsAuthenticated } from '@/lib/ops';
import { Button, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function OpsPage() {
  const [counts, campaignCount, authenticated] = await Promise.all([getVisitorCounts(), getCampaignCount(), isOpsAuthenticated()]);
  const snapshot = authenticated ? await getOpsSnapshot() : null;
  const opsEnabled = Boolean(process.env.OPS_DASHBOARD_KEY);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="trust-page saved-page">
        <span className="eyebrow">Ops</span>
        <h1>운영 상태를 한 화면에서 확인해요.</h1>
        <p>크롤링 건강도, 유저 저장/리마인드 사용량, 방문자 흐름, 광고 슬롯 상태를 빠르게 체크할 수 있어요.</p>
        {!opsEnabled ? (
          <EmptyState
            icon="alert-triangle"
            title="운영 세션 설정이 아직 준비되지 않았어요"
            body="세션 서명용 환경값이 있어야 보호된 운영 대시보드를 사용할 수 있어요."
          />
        ) : !authenticated ? (
          <form className="account-form-shell ops-login-form" action="/api/ops/login" method="post">
            <label className="rk-field" htmlFor="opsKey">
              <span className="rk-field__label">관리자 비밀번호</span>
              <input id="opsKey" className="rk-input" name="opsKey" type="password" placeholder="등록된 관리자 비밀번호" required />
            </label>
            <Button type="submit">대시보드 열기</Button>
          </form>
        ) : (
          <>
            <div className="stats-strip ops-stats">
              <div><strong>{snapshot.activeCampaigns.toLocaleString('ko-KR')}</strong><span>활성 캠페인</span></div>
              <div><strong>{snapshot.visitorsToday.toLocaleString('ko-KR')}</strong><span>오늘 방문자</span></div>
              <div><strong>{snapshot.visitorsTotal.toLocaleString('ko-KR')}</strong><span>전체 방문자</span></div>
              <div><strong>{snapshot.userCount.toLocaleString('ko-KR')}</strong><span>회원 수</span></div>
              <div><strong>{snapshot.savedCount.toLocaleString('ko-KR')}</strong><span>저장 수</span></div>
              <div><strong>{snapshot.reminderCount.toLocaleString('ko-KR')}</strong><span>리마인드 수</span></div>
            </div>
            <section className="detail-grid ops-grid">
              <article className="info-panel">
                <h2>최근 크롤링 작업</h2>
                <div className="ops-list">
                  {snapshot.recentJobs.map((job) => (
                    <div key={job.id} className="ops-row">
                      <strong>{job.source?.name || '미상 소스'} · {job.job_status}</strong>
                      <span>{new Date(job.created_at).toLocaleString('ko-KR')}</span>
                      <span>fetched {job.fetched_count} / inserted {job.inserted_count}</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="info-panel">
                <h2>소스별 수집 현황</h2>
                <div className="ops-list">
                  {snapshot.sourceStats.map((source) => (
                    <div key={source.id} className="ops-row">
                      <strong>{source.name}</strong>
                      <span>{source.slug}</span>
                      <span>active {source.activeCampaigns} / exact {source.exactLocationCount} / latlng {source.latLngCount}</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="info-panel">
                <h2>광고 슬롯</h2>
                <div className="ops-list">
                  {snapshot.sponsors.length ? snapshot.sponsors.map((slot) => (
                    <div key={slot.id} className="ops-row">
                      <strong>{slot.slot_key}</strong>
                      <span>{slot.title}</span>
                      <span>{slot.is_active ? '활성' : '비활성'}</span>
                    </div>
                  )) : <p>등록된 스폰서 슬롯이 없어요.</p>}
                </div>
              </article>
            </section>
            <form action="/api/ops/logout" method="post">
              <Button type="submit" variant="secondary">운영 세션 종료</Button>
            </form>
          </>
        )}
      </section>
    </SiteShell>
  );
}
