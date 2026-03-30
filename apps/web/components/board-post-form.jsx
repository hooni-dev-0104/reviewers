'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, Surface } from '@/components/ui-kit';
import { inputClass, textareaClass } from '@/lib/ui';

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
    <Surface as="form" className="grid gap-4 p-6 sm:p-8" onSubmit={handleSubmit}>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">닉네임</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={20} placeholder="예: 리뷰콕 사용자" required className={inputClass} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">공개 여부</span>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className={inputClass}>
            <option value="public">공개 글</option>
            <option value="private">비공개 글</option>
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">제목</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="무엇을 남기고 싶은지 한 줄로 적어주세요." required className={inputClass} />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">본문</span>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={10} maxLength={5000} placeholder="문의 내용, 요청사항, 사용 후기, 응원 한마디를 편하게 적어주세요." required className={textareaClass} />
      </label>

      {visibility === 'private' ? (
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">비밀번호</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={4} maxLength={64} placeholder="열람할 때 사용할 비밀번호" required className={inputClass} />
        </label>
      ) : null}

      <input type="text" name="website" autoComplete="off" tabIndex={-1} className="hidden" />

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-500">작성이 끝나면 바로 상세 페이지로 이동해요.</p>
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? '작성 중…' : '게시하기'}
        </Button>
      </div>
    </Surface>
  );
}
