'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAppClient } from '@/components/app-client-providers';
import { Button, SegmentedControl } from '@/components/ui';

function getSafeNext(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return '/saved';
  }

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) {
      return '/saved';
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/saved';
  }
}

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
    router.push(getSafeNext(searchParams.get('next')));
    router.refresh();
  }

  return (
    <div className="account-form-shell">
      <SegmentedControl
        options={[
          { value: 'login', label: '로그인' },
          { value: 'signup', label: '회원가입' }
        ]}
        value={mode}
        onChange={setMode}
        className="account-mode-row"
      />
      <form className="account-form" onSubmit={onSubmit}>
        {mode === 'signup' ? (
          <label className="rk-field" htmlFor="displayName">
            <span className="rk-field__label">닉네임</span>
            <input id="displayName" className="rk-input" name="displayName" placeholder="리뷰콕에서 표시할 이름" autoComplete="nickname" />
          </label>
        ) : null}
        <label className="rk-field" htmlFor="email">
          <span className="rk-field__label">이메일</span>
          <input id="email" className="rk-input" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
        </label>
        <label className="rk-field" htmlFor="password">
          <span className="rk-field__label">비밀번호</span>
          <input id="password" className="rk-input" name="password" type="password" placeholder="8자 이상" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <Button type="submit" disabled={pending}>{pending ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}</Button>
      </form>
    </div>
  );
}
