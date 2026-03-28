import Link from 'next/link';

import { formatBoardDate } from '@/lib/board';

export function BoardPostList({ posts = [], basePath = '/board' }) {
  if (!posts.length) {
    return (
      <section className="empty-state">
        <p>아직 게시글이 없어요.</p>
        <span>첫 번째 글을 남겨보세요.</span>
      </section>
    );
  }

  return (
    <section className="board-list">
      {posts.map((post) => (
        <article key={post.id} className="board-row">
          <div className="board-row-head">
            <span className={`badge ${post.visibility === 'private' ? 'badge-warn' : 'badge-ok'}`}>
              {post.visibility === 'private' ? '비공개' : '공개'}
            </span>
            <h3>
              <Link href={`${basePath}/${post.id}`}>{post.title}</Link>
            </h3>
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
