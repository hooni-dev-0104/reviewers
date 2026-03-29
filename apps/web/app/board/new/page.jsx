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
      <section className="trust-page saved-page board-page-shell board-subpage-shell">
        <div className="board-hero-card board-subhero-card">
          <div className="board-hero-copy board-subhero-copy">
            <span className="eyebrow">게시판 글쓰기</span>
            <h1 className="board-subhero-title">생각난 내용을 바로 남겨보세요.</h1>
            <p className="board-subhero-description">문의, 요청, 사용 후기까지 편하게 적을 수 있어요. 필요한 경우 비공개 글로 남겨도 됩니다.</p>
            <div className="board-topic-chips" aria-label="작성 가능한 글 유형">
              <span>공개 글</span>
              <span>비공개 글</span>
              <span>빠른 문의</span>
            </div>
          </div>
          <div className="board-hero-side board-subhero-side">
            <Link href="/board" className="board-secondary-link">목록으로</Link>
            <div className="board-inline-note">
              <strong>비공개 글 안내</strong>
              <span>작성한 닉네임과 비밀번호를 입력한 사람만 본문을 볼 수 있어요.</span>
            </div>
          </div>
        </div>

        <div className="board-compose-grid">
          <BoardPostForm />

          <aside className="board-side-guide">
            <h2>작성 전에 확인해 주세요</h2>
            <ul>
              <li>제목은 한눈에 알아보기 쉽게 짧고 분명하게 적어주세요.</li>
              <li>오류 제보나 요청은 상황을 함께 적어주면 더 빠르게 확인할 수 있어요.</li>
              <li>민감한 내용은 비공개 글로 남기면 조금 더 안전하게 전달할 수 있어요.</li>
            </ul>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
