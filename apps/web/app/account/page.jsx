import { AccountForm } from '@/components/account-form';
import { PageHero } from '@/components/ui-kit';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const [counts, campaignCount] = await Promise.all([getVisitorCounts(), getCampaignCount()]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <PageHero
        eyebrow="Account workflow"
        title="로그인하고 저장과 리마인드를 끊김 없이 이어가세요"
        description="폼 요소를 단순화하고 계정 진입 CTA를 더 명확하게 정리해 전환 흐름을 개선했습니다."
        stats={[
          { label: '핵심 기능', value: '저장 + 리마인드', hint: '계정 기반으로 이어보기' },
          { label: '입력 단계', value: '최소 입력', hint: '필수 필드만 노출' },
          { label: '모바일 UX', value: '간결한 폼', hint: '세로 흐름 최적화' }
        ]}
      />
      <AccountForm />
    </SiteShell>
  );
}
