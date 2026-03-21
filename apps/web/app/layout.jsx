import './globals.css';

import { AppClientProviders } from '@/components/app-client-providers';

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

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <AppClientProviders>{children}</AppClientProviders>
      </body>
    </html>
  );
}
