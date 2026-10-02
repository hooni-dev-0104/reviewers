// Conservative launch policy: no bulk filtered URLs or unverified campaign dates.
export default function sitemap() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://reviewkok.vercel.app';
  return ['/', '/trust'].map(path => ({ url: `${origin}${path}` }));
}
