'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAppClient } from '@/components/app-client-providers';

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
    <div className="account-form-shell">
      <div className="account-mode-row">
        <button type="button" className={mode === 'login' ? 'mode-active' : ''} onClick={() => setMode('login')}>로그인</button>
        <button type="button" className={mode === 'signup' ? 'mode-active' : ''} onClick={() => setMode('signup')}>회원가입</button>
      </div>
      <form className="account-form" onSubmit={onSubmit}>
        {mode === 'signup' ? (
          <div className="search-stack">
            <label htmlFor="displayName">닉네임</label>
            <input id="displayName" name="displayName" placeholder="리뷰어스에서 표시할 이름" autoComplete="nickname" />
          </div>
        ) : null}
        <div className="search-stack">
          <label htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div className="search-stack">
          <label htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" placeholder="8자 이상" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={pending}>{pending ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}</button>
      </form>
    </div>
  );
}
