import { deadlineInstant } from './dates.js';
export function campaignMetadata(campaign, now = Date.now()) {
  if (!campaign || !['active', 'expired'].includes(campaign.status)) return { title: '캠페인을 찾을 수 없어요 | 리뷰콕', robots: { index: false, follow: false } };
  const title = `${campaign.title} | 리뷰콕`;
  const description = [campaign.benefit_text, campaign.region_primary_name, '모집 조건과 신청은 외부 원문에서 확인하세요.'].filter(Boolean).join(' · ').slice(0, 160);
  const canonical = `/campaign/${campaign.id}`;
  const expired = campaign.status === 'expired' || deadlineInstant(campaign.apply_deadline) < now;
  return { title, description, alternates: { canonical }, robots: { index: !expired, follow: true }, openGraph: { title, description, url: canonical, images: ['/opengraph-image'] }, twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] } };
}
