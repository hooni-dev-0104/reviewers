'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopTabs() {
  const pathname = usePathname();
  const isMap = pathname === '/map';

  return (
    <nav className="top-tabs" aria-label="주요 탐색 탭">
      <Link href="/" className={!isMap ? 'active' : ''}>
        목록
      </Link>
      <Link href="/map" className={isMap ? 'active' : ''}>
        체험단 지도
      </Link>
    </nav>
  );
}
