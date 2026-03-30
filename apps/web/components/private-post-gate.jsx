'use client';

import { useState } from 'react';

export function PrivatePostGate({ postId, post }) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [body, setBody] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleUnlock(event) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      const response = await fetch(`/api/board/${postId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || '열람에 실패했어요.');
      }
      setBody(payload.post.body || '');
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : '열람에 실패했어요.');
    } finally {
      setPending(false);
    }
  }

  if (body != null) {
    return (
      <article className="info-panel board-detail-body-card">
        <h2>본문</h2>
        <div className="board-body">{body}</div>
      </article>
    );
  }

  return (
    <article className="info-panel board-private-gate">
      <span className="badge badge-warn">비공개 글</span>
      <h2>본문을 확인해 보세요</h2>
      <p className="board-private-description">작성한 닉네임과 비밀번호를 입력하면 본문을 바로 열 수 있어요.</p>
      <div className="board-locked-meta board-private-preview">
        <strong>제목</strong>
        <span>{post.title}</span>
      </div>
      <form className="board-form-shell board-private-form" onSubmit={handleUnlock}>
        <label className="search-stack board-field">
          <span>닉네임</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="작성한 닉네임" required />
        </label>
        <label className="search-stack board-field">
          <span>비밀번호</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" required />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="board-form-actions board-private-actions">
          <button type="submit" className="board-submit-button" disabled={pending}>{pending ? '확인 중…' : '본문 확인하기'}</button>
          <p className="board-submit-note">입력한 정보가 맞으면 이 화면에서 바로 본문이 열려요.</p>
        </div>
      </form>
    </article>
  );
}
