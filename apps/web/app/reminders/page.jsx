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
        <span className="eyebrow">리마인드</span>
        <h1>다가오는 마감을 놓치지 않게 정리해두자.</h1>
        <p>마감 전에 다시 볼 시간을 저장하는 목록입니다. 이메일·푸시 알림은 현재 발송하지 않아요.</p>
        {!user ? (
          <section className="empty-state">
            <p>리마인드를 보려면 로그인해 주세요.</p>
            <Link href="/account?next=/reminders">로그인하러 가기</Link>
          </section>
        ) : !items.length ? (
          <section className="empty-state">
            <p>설정된 리마인드가 없어요.</p>
            <span>알림 발송 기능은 준비 중입니다. 관심 캠페인은 저장 목록에서 다시 확인해 주세요.</span>
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
