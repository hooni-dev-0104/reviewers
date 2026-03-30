import Link from 'next/link';

import { formatBoardDate } from '@/lib/board';

export function BoardPostList({ posts = [], basePath = '/board', showDelete = false }) {
  const showWriteCta = basePath === '/board' && !showDelete;

  if (!posts.length) {
    return (
      <section className="empty-state board-empty-state">
        <div className="board-empty-badge" aria-hidden="true">✍️</div>
        <div className="board-empty-copy">
          <p className="board-empty-title">아직 게시글이 없어요.</p>
          <span>첫 번째 문의나 의견을 남겨주세요. 짧은 응원 한마디도 큰 힘이 돼요.</span>
        </div>
        {showWriteCta ? (
          <div className="board-empty-actions">
            <Link href="/board/new" className="board-empty-link">
              첫 글 남기기
            </Link>
            <small>원하는 공개 범위로 바로 작성할 수 있어요.</small>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="board-list">
      {posts.map((post) => (
        <article key={post.id} className="board-row">
          <div className="board-row-head">
            <div className="board-row-head-main">
            <span className={`badge ${post.visibility === 'private' ? 'badge-warn' : 'badge-ok'}`}>
                {post.visibility === 'private' ? '비공개' : '공개'}
              </span>
              <h3>
                <Link href={`${basePath}/${post.id}`} className="board-row-title-link">{post.title}</Link>
              </h3>
            </div>
            {showDelete ? (
              <form action={`/api/ops/board/${post.id}/delete`} method="post">
                <button type="submit" className="board-delete-button">삭제</button>
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
