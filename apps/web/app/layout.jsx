import './globals.css';

import { IBM_Plex_Sans_KR, Noto_Serif_KR } from 'next/font/google';

import { AppClientProviders } from '@/components/app-client-providers';
import { getCurrentUser } from '@/lib/auth';

const bodyFont = IBM_Plex_Sans_KR({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'korean'],
  variable: '--font-body'
});

const displayFont = Noto_Serif_KR({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'korean'],
  variable: '--font-display'
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://reviewers-ten.vercel.app'),
  title: '리뷰어스 | 믿고 고르는 체험단 탐색',
  description: '레뷰·리뷰노트·포블로그·디너의여왕 캠페인을 한 곳에서 탐색하고 빠르게 판단할 수 있는 체험단 탐색 서비스.',
  openGraph: {
    title: '리뷰어스 | 믿고 고르는 체험단 탐색',
    description: '체험단 지원 전에 필요한 정보만 빠르게 확인하는 applicant-first 탐색 서비스',
    url: 'https://reviewers-ten.vercel.app',
    siteName: '리뷰어스',
    locale: 'ko_KR',
    type: 'website'
  }
};

export default async function RootLayout({ children }) {
  const initialSession = await getCurrentUser();

  return (
    <html lang="ko">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <AppClientProviders initialSession={initialSession}>{children}</AppClientProviders>
      </body>
    </html>
  );
}
