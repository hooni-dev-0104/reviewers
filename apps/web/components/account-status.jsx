'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAppClient } from '@/components/app-client-providers';

export function AccountStatus() {
  const router = useRouter();
  const { session, loading, refreshAll } = useAppClient();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refreshAll();
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return <span className="account-chip">계정 확인 중…</span>;
  }

  if (!session) {
    return (
      <Link href="/account" className="account-chip">
        로그인 / 회원가입
      </Link>
    );
  }

  return (
    <div className="account-group">
      <Link href="/saved" className="account-chip account-chip-strong">
        {session.display_name || session.email}
      </Link>
      <button type="button" onClick={logout} className="account-chip">
        로그아웃
      </button>
    </div>
  );
}
