'use client';

import { useState } from 'react';

import { Button, Surface } from '@/components/ui-kit';
import { inputClass } from '@/lib/ui';

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
      <Surface className="space-y-4 p-6 sm:p-8">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">본문</span>
          <div className="board-body rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">{body}</div>
        </div>
      </Surface>
    );
  }

  return (
    <Surface className="space-y-5 p-6 sm:p-8">
      <div className="space-y-2">
        <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">비공개 글</span>
        <h2 className="text-[28px] font-semibold tracking-[-0.04em] text-slate-950">본문을 확인해 보세요</h2>
        <p className="text-sm leading-7 text-slate-600">작성한 닉네임과 비밀번호를 입력하면 본문을 바로 열 수 있어요.</p>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <strong className="block text-slate-950">제목</strong>
        <span>{post.title}</span>
      </div>

      <form className="grid gap-4" onSubmit={handleUnlock}>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">닉네임</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="작성한 닉네임" required className={inputClass} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">비밀번호</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" required className={inputClass} />
        </label>
        {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-500">입력한 정보가 맞으면 이 화면에서 바로 본문이 열려요.</p>
          <Button type="submit" variant="primary" size="lg" disabled={pending}>
            {pending ? '확인 중…' : '본문 확인하기'}
          </Button>
        </div>
      </form>
    </Surface>
  );
}
