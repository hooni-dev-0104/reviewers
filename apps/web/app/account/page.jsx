import { AccountForm } from '@/components/account-form';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const [counts, campaignCount] = await Promise.all([getVisitorCounts(), getCampaignCount()]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="trust-page saved-page account-page">
        <span className="eyebrow">계정</span>
        <h1>로그인하고 저장·리마인드를 이어가자.</h1>
        <p>로그인하면 저장한 캠페인과 리마인드를 브라우저가 바뀌어도 이어서 볼 수 있어요.</p>
        <AccountForm />
      </section>
    </SiteShell>
  );
}
