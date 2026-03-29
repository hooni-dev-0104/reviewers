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
    <form className="board-form-shell board-form-card" onSubmit={handleSubmit}>
      <div className="board-form-grid">
        <label className="search-stack board-field">
          <span>닉네임</span>
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={20}
            placeholder="예: 리뷰콕 사용자"
            required
          />
          <small className="board-field-hint">답변을 구분할 수 있는 닉네임이면 충분해요.</small>
        </label>
        <label className="search-stack board-field">
          <span>공개 여부</span>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
            <option value="public">공개 글</option>
            <option value="private">비공개 글</option>
          </select>
          <small className="board-field-hint">
            {visibility === 'private' ? '작성한 닉네임과 비밀번호로만 본문을 볼 수 있어요.' : '누구나 바로 읽을 수 있는 글이에요.'}
          </small>
        </label>
      </div>

      <label className="search-stack board-field">
        <span>제목</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder="무엇을 남기고 싶은지 한 줄로 적어주세요."
          required
        />
      </label>

      <label className="search-stack board-field">
        <span>본문</span>
        <textarea
          className="board-textarea"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={10}
          maxLength={5000}
          placeholder="문의 내용, 요청사항, 사용 후기, 응원 한마디를 편하게 적어주세요."
          required
        />
        <small className="board-field-hint">상황이나 원하는 결과를 함께 적어주면 더 빠르게 확인할 수 있어요.</small>
      </label>

      {visibility === 'private' ? (
        <label className="search-stack board-field board-conditional-field">
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={4}
            maxLength={64}
            placeholder="열람할 때 사용할 비밀번호"
            required
          />
          <small className="board-field-hint">최소 4자 이상 입력해 주세요.</small>
        </label>
      ) : null}

      <input type="text" name="website" autoComplete="off" tabIndex={-1} className="board-honeypot" />

      {error ? <p className="form-error">{error}</p> : null}

      <div className="board-form-actions">
        <button type="submit" className="board-submit-button" disabled={pending}>{pending ? '작성 중…' : '게시하기'}</button>
        <p className="board-submit-note">작성이 끝나면 바로 상세 페이지로 이동해요.</p>
      </div>
    </form>
  );
}
