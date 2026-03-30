import { notFound } from 'next/navigation';

import { PrivatePostGate } from '@/components/private-post-gate';
import { Badge, ButtonLink, PageHero, Surface } from '@/components/ui-kit';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { formatBoardDate, getBoardPostForPublic } from '@/lib/board';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function BoardDetailPage({ params }) {
  const { id } = await params;
  const [counts, campaignCount, post] = await Promise.all([
    getVisitorCounts(),
    getCampaignCount(),
    getBoardPostForPublic(id)
  ]);

  if (!post) {
    notFound();
  }

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <PageHero
        eyebrow="Board detail"
        title={post.title}
        description={post.visibility === 'private'
          ? '비공개 글이라 작성한 닉네임과 비밀번호를 입력해야 본문을 확인할 수 있어요.'
          : '공개 글이라 누구나 바로 내용을 읽을 수 있어요.'}
        actions={[
          <ButtonLink key="list" href="/board" variant="secondary" size="lg">목록으로</ButtonLink>
        ]}
        stats={[
          { label: '작성자', value: post.nickname, hint: '게시글 작성자' },
          { label: '공개 여부', value: post.visibility === 'private' ? '비공개' : '공개', hint: '본문 접근 방식' },
          { label: '작성일', value: formatBoardDate(post.created_at), hint: '마지막 기록 시점' }
        ]}
        aside={(
          <div className="space-y-3">
            <Badge tone={post.visibility === 'private' ? 'warn' : 'success'}>
              {post.visibility === 'private' ? '비공개 글' : '공개 글'}
            </Badge>
            <p className="text-sm leading-7 text-slate-600">작성 정보와 공개 상태를 먼저 보여주고 본문을 뒤에 배치해 읽는 흐름을 더 명확하게 정리했습니다.</p>
          </div>
        )}
      />

      <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Surface className="space-y-4 p-6 sm:p-8">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">글 정보</span>
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p><strong className="text-slate-950">닉네임</strong> · {post.nickname}</p>
              <p><strong className="text-slate-950">작성일</strong> · {formatBoardDate(post.created_at)}</p>
              <p><strong className="text-slate-950">공개 여부</strong> · {post.visibility === 'private' ? '비공개' : '공개'}</p>
            </div>
          </div>
        </Surface>

        {post.visibility === 'public' ? (
          <Surface className="space-y-4 p-6 sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">본문</span>
            <div className="board-body rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">{post.body}</div>
          </Surface>
        ) : (
          <PrivatePostGate postId={post.id} post={post} />
        )}
      </section>
    </SiteShell>
  );
}
