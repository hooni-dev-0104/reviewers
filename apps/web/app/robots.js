export default function robots() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://reviewkok.vercel.app';
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/ops', '/account', '/saved', '/reminders', '/board/new'] }], sitemap: `${origin}/sitemap.xml` };
}
