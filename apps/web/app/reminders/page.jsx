import Link from 'next/link';

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
      <section className="trust-page saved-page">
        <span className="eyebrow">Reminders</span>
        <h1>다가오는 마감을 놓치지 않게 정리해두자.</h1>
        <p>마감 전에 다시 볼 캠페인을 시간 단위로 정리할 수 있어요. 현재는 웹 안에서 확인하는 리마인드 중심이에요.</p>
        {!user ? (
          <section className="empty-state">
            <p>리마인드를 보려면 로그인해 주세요.</p>
            <Link href="/account?next=/reminders">로그인하러 가기</Link>
          </section>
        ) : !items.length ? (
          <section className="empty-state">
            <p>설정된 리마인드가 없어요.</p>
            <span>상세 페이지에서 3시간, 24시간, 72시간 전 리마인드를 설정할 수 있어요.</span>
          </section>
        ) : (
          <section className="saved-list">
            {items.map((item) => (
              <article key={item.id} className="saved-row">
                <div>
                  <h3>{item.campaign.title}</h3>
                  <div className="chip-row compact-row">
                    <span>{formatRegion(item.campaign)}</span>
                    <span>{formatDeadline(item.campaign.apply_deadline)}</span>
                    <span>{item.remind_before_hours}시간 전</span>
                  </div>
                </div>
                <div className="saved-actions">
                  <Link href={`/campaign/${item.campaign.id}`}>상세 보기</Link>
                  <a href={item.campaign.original_url} target="_blank" rel="noreferrer">원문 이동</a>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </SiteShell>
  );
}
