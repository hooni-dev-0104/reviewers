import { notFound } from 'next/navigation';

import { Badge, Button, ButtonLink, PageHero, Surface } from '@/components/ui-kit';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { formatBoardDate, getBoardPostForOps } from '@/lib/board';
import { isOpsAuthenticated } from '@/lib/ops';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function OpsBoardDetailPage({ params }) {
  const authenticated = await isOpsAuthenticated();
  if (!authenticated) {
    notFound();
  }

  const { id } = await params;
  const [counts, campaignCount, post] = await Promise.all([
    getVisitorCounts(),
    getCampaignCount(),
    getBoardPostForOps(id)
  ]);

  if (!post) {
    notFound();
  }

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <PageHero
        eyebrow="Ops board detail"
        title={post.title}
        description="관리자 권한으로 본문까지 바로 확인할 수 있는 상세 화면입니다."
        actions={[
          <ButtonLink key="list" href="/ops/board" variant="secondary" size="lg">목록으로</ButtonLink>
        ]}
        stats={[
          { label: '작성자', value: post.nickname, hint: '게시글 작성자' },
          { label: '공개 여부', value: post.visibility === 'private' ? '비공개' : '공개', hint: '관리자 열람 가능' },
          { label: '작성일', value: formatBoardDate(post.created_at), hint: '마지막 기록 시점' }
        ]}
        aside={<Badge tone={post.visibility === 'private' ? 'warn' : 'success'}>{post.visibility === 'private' ? '비공개 글' : '공개 글'}</Badge>}
      />

      <div className="flex justify-end">
        <form action={`/api/ops/board/${post.id}/delete`} method="post">
          <Button type="submit" variant="danger" size="md">삭제</Button>
        </form>
      </div>

      <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Surface className="space-y-4 p-6 sm:p-8">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">글 정보</span>
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p><strong className="text-slate-950">닉네임</strong> · {post.nickname}</p>
            <p><strong className="text-slate-950">작성일</strong> · {formatBoardDate(post.created_at)}</p>
            <p><strong className="text-slate-950">공개 여부</strong> · {post.visibility === 'private' ? '비공개' : '공개'}</p>
          </div>
        </Surface>
        <Surface className="space-y-4 p-6 sm:p-8">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">본문</span>
          <div className="board-body rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">{post.body}</div>
        </Surface>
      </section>
    </SiteShell>
  );
}
