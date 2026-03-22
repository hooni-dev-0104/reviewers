import './globals.css';

import { AppClientProviders } from '@/components/app-client-providers';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://reviewkok.vercel.app'),
  title: '리뷰콕 | 체험단 캠페인 탐색',
  description: '다양한 체험단을 더 빠르게 비교하고, 나에게 맞는 경험을 골라보세요.',
  openGraph: {
    title: '리뷰콕 | 체험단 캠페인 탐색',
    description: '다양한 체험단을 더 빠르게 비교하고, 나에게 맞는 경험을 골라보세요.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://reviewkok.vercel.app',
    siteName: '리뷰콕',
    images: ['/opengraph-image'],
    locale: 'ko_KR',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: '리뷰콕 | 체험단 캠페인 탐색',
    description: '다양한 체험단을 더 빠르게 비교하고, 나에게 맞는 경험을 골라보세요.',
    images: ['/opengraph-image']
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
