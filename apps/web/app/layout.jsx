import './globals.css';

import { AppClientProviders } from '@/components/app-client-providers';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://reviewkok.vercel.app'),
  title: '리뷰콕 | 체험단 캠페인 탐색',
  description: '레뷰·리뷰노트·포블로그·디너의여왕 캠페인을 한 곳에서 비교하는 체험단 탐색 서비스.',
  openGraph: {
    title: '리뷰콕 | 체험단 캠페인 탐색',
    description: '레뷰·리뷰노트·포블로그·디너의여왕 캠페인을 한 곳에서 비교하는 체험단 탐색 서비스.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://reviewkok.vercel.app',
    siteName: '리뷰콕',
    locale: 'ko_KR',
    type: 'website'
  }
};

export default async function RootLayout({ children }) {
  const initialSession = await getCurrentUser();

  return (
    <html lang="ko">
      <body>
        <AppClientProviders initialSession={initialSession}>{children}</AppClientProviders>
      </body>
    </html>
  );
}
