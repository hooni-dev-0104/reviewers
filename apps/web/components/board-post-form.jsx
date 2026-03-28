'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function BoardPostForm() {
  const router = useRouter();
  const [visibility, setVisibility] = useState('public');
  const [nickname, setNickname] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visibility,
          nickname,
          title,
          body,
          password: visibility === 'private' ? password : '',
          website: ''
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || '글 작성에 실패했어요.');
      }
      router.push(`/board/${payload.post.id}`);
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : '글 작성에 실패했어요.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="board-form-shell" onSubmit={handleSubmit}>
      <div className="board-form-grid">
        <label className="search-stack">
          <span>닉네임</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={20} required />
        </label>
        <label className="search-stack">
          <span>공개 여부</span>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
            <option value="public">공개 글</option>
            <option value="private">비공개 글</option>
          </select>
        </label>
      </div>

      <label className="search-stack">
        <span>제목</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required />
      </label>

      <label className="search-stack">
        <span>본문</span>
        <textarea
          className="board-textarea"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={10}
          maxLength={5000}
          required
        />
      </label>

      {visibility === 'private' ? (
        <label className="search-stack">
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={4}
            maxLength={64}
            required
          />
        </label>
      ) : null}

      <input type="text" name="website" autoComplete="off" tabIndex={-1} className="board-honeypot" />

      {error ? <p className="form-error">{error}</p> : null}

      <div className="hero-actions">
        <button type="submit" disabled={pending}>{pending ? '작성 중…' : '글 올리기'}</button>
      </div>
    </form>
  );
}
