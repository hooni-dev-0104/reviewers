'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from '@/components/ui';

const ITEMS = [
  { href: '/', id: 'explore', label: '탐색', icon: 'home' },
  { href: '/map', id: 'map', label: '지도', icon: 'map-pin' },
  { href: '/saved', id: 'saved', label: '저장', icon: 'bookmark' },
  { href: '/board', id: 'board', label: '게시판', icon: 'message-square' }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="rk-bottomnav" aria-label="모바일 주요 탐색">
      {ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href, item.id);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={['rk-bottomnav__item', active ? 'is-active' : ''].filter(Boolean).join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            <Icon name={item.icon} size={22} filled={active} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function isActivePath(pathname, href, id) {
  if (id === 'explore') {
    return pathname === '/' || pathname.startsWith('/campaign');
  }
  if (href === '/board') {
    return pathname.startsWith('/board');
  }
  return pathname === href;
}
