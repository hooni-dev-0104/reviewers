import Link from 'next/link';

import { formatBoardDate } from '@/lib/board';
import { Badge, ButtonLink, EmptyState, Surface } from '@/components/ui-kit';

export function BoardPostList({ posts = [], basePath = '/board', showDelete = false }) {
  const showWriteCta = basePath === '/board' && !showDelete;

  if (!posts.length) {
    return (
      <EmptyState
        title="아직 게시글이 없어요"
        description="첫 번째 문의나 의견을 남겨주세요. 짧은 응원 한마디도 큰 힘이 돼요."
        actions={showWriteCta ? [<ButtonLink key="write" href="/board/new" variant="primary">첫 글 남기기</ButtonLink>] : undefined}
      />
    );
  }

  return (
    <section className="grid gap-4">
      {posts.map((post) => (
        <Surface key={post.id} className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge tone={post.visibility === 'private' ? 'warn' : 'success'}>
                  {post.visibility === 'private' ? '비공개' : '공개'}
                </Badge>
                <Badge>{post.nickname}</Badge>
                <Badge>{formatBoardDate(post.created_at)}</Badge>
              </div>
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                <Link href={`${basePath}/${post.id}`}>{post.title}</Link>
              </h3>
            </div>
            {showDelete ? (
              <form action={`/api/ops/board/${post.id}/delete`} method="post">
                <button type="submit" className="inline-flex h-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100">
                  삭제
                </button>
              </form>
            ) : null}
          </div>
          <p className="text-sm leading-7 text-slate-600">
            {post.visibility === 'public' && post.body
              ? post.body
              : '비공개 글입니다. 제목은 공개되고 본문은 잠겨 있어요.'}
          </p>
        </Surface>
      ))}
    </section>
  );
}
