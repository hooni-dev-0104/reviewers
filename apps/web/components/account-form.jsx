'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAppClient } from '@/components/app-client-providers';
import { Button, Surface } from '@/components/ui-kit';
import { cn, inputClass } from '@/lib/ui';

export function AccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAll } = useAppClient();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get('email') || ''),
      password: String(formData.get('password') || ''),
      displayName: String(formData.get('displayName') || '')
    };

    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || '요청을 처리하지 못했어요.');
      return;
    }

    await refreshAll();
    const next = searchParams.get('next') || '/saved';
    router.push(next);
    router.refresh();
  }

  return (
    <Surface className="space-y-6 p-6 sm:p-8">
      <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-2">
        {['login', 'signup'].map((value) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              className={cn(
                'inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition',
                active ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-950'
              )}
              onClick={() => setMode(value)}
            >
              {value === 'login' ? '로그인' : '회원가입'}
            </button>
          );
        })}
      </div>

      <form className="grid gap-4" onSubmit={onSubmit}>
        {mode === 'signup' ? (
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">닉네임</span>
            <input id="displayName" name="displayName" placeholder="리뷰콕에서 표시할 이름" autoComplete="nickname" className={inputClass} />
          </label>
        ) : null}
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">이메일</span>
          <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required className={inputClass} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">비밀번호</span>
          <input id="password" name="password" type="password" placeholder="8자 이상" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required className={inputClass} />
        </label>
        {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
          {pending ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}
        </Button>
      </form>
    </Surface>
  );
}
