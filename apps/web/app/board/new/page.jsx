import Link from 'next/link';

import { BoardPostForm } from '@/components/board-post-form';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function BoardNewPage() {
  const [counts, campaignCount] = await Promise.all([getVisitorCounts(), getCampaignCount()]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="trust-page saved-page">
        <span className="eyebrow">게시판 글쓰기</span>
        <h1>공개 또는 비공개 글을 남겨보세요.</h1>
        <p>비공개 글은 닉네임과 비밀번호를 입력한 사람만 본문을 확인할 수 있어요.</p>
        <div className="hero-actions">
          <Link href="/board" className="ghost-link">목록으로</Link>
        </div>
        <BoardPostForm />
      </section>
    </SiteShell>
  );
}
