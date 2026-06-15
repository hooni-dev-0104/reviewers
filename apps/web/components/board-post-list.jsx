import Link from 'next/link';

import { formatBoardDate } from '@/lib/board';
import { Badge, Button, ButtonLink, EmptyState } from '@/components/ui';

export function BoardPostList({ posts = [], basePath = '/board', showDelete = false }) {
  const showWriteCta = basePath === '/board' && !showDelete;

  if (!posts.length) {
    return (
      <EmptyState
        icon="pen-line"
        title="아직 게시글이 없어요"
        body="첫 번째 문의나 의견을 남겨주세요. 짧은 응원 한마디도 큰 힘이 돼요."
        className="board-empty-state"
        action={showWriteCta ? <ButtonLink href="/board/new" variant="quiet" size="sm">첫 글 남기기</ButtonLink> : null}
      />
    );
  }

  return (
    <section className="board-list">
      {posts.map((post) => (
        <article key={post.id} className="board-row">
          <div className="board-row-head">
            <div className="board-row-head-main">
              <Badge tone={post.visibility === 'private' ? 'warning' : 'success'} showIcon>
                {post.visibility === 'private' ? '비공개' : '공개'}
              </Badge>
              <h3>
                <Link href={`${basePath}/${post.id}`} className="board-row-title-link">{post.title}</Link>
              </h3>
            </div>
            {showDelete ? (
              <form action={`/api/ops/board/${post.id}/delete`} method="post">
                <Button type="submit" variant="danger" size="sm" className="board-delete-button">삭제</Button>
              </form>
            ) : null}
          </div>
          <div className="board-row-meta">
            <span>{post.nickname}</span>
            <span>{formatBoardDate(post.created_at)}</span>
          </div>
          {post.visibility === 'public' && post.body ? (
            <p className="board-row-preview">{post.body}</p>
          ) : (
            <p className="board-row-preview board-row-preview-muted">비공개 글입니다. 제목은 공개되고 본문은 잠겨 있어요.</p>
          )}
        </article>
      ))}
    </section>
  );
}
