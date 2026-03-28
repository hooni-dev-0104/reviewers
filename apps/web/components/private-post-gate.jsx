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
      <article className="info-panel">
        <h2>본문</h2>
        <div className="board-body">{body}</div>
      </article>
    );
  }

  return (
    <article className="info-panel">
      <h2>비공개 글 열람</h2>
      <p>비공개 글은 작성한 닉네임과 비밀번호로 확인할 수 있어요.</p>
      <form className="board-form-shell" onSubmit={handleUnlock}>
        <label className="search-stack">
          <span>닉네임</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} required />
        </label>
        <label className="search-stack">
          <span>비밀번호</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="hero-actions">
          <button type="submit" disabled={pending}>{pending ? '확인 중…' : '본문 확인하기'}</button>
        </div>
      </form>
      <div className="board-locked-meta">
        <strong>제목</strong>
        <span>{post.title}</span>
      </div>
    </article>
  );
}
