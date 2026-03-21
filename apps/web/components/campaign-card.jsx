import Link from 'next/link';

import {
  formatCampaignType,
  formatDeadline,
  formatPlatform,
  formatRegion,
  formatSourceName,
  formatSourceTone,
  getConfidence,
  getDeadlineState
} from '@/lib/format';

export function CampaignCard({ campaign }) {
  const confidence = getConfidence(campaign);
  const deadlineState = getDeadlineState(campaign.apply_deadline);
  const sourceSlug = campaign.sources?.slug || 'unknown';

  return (
    <article className={`campaign-card tone-${formatSourceTone(sourceSlug)}`}>
      <div className="card-meta-row">
        <span className="source-chip">{formatSourceName(campaign.sources)}</span>
        <span className={`badge badge-${confidence.tone}`}>{confidence.label}</span>
      </div>

      <Link href={`/campaign/${campaign.id}`} className="card-link-block">
        <h3>{campaign.title}</h3>
        <p>{campaign.snippet || '지원 전에 핵심 조건을 빠르게 확인해보세요.'}</p>
      </Link>

      <div className="chip-row">
        <span>{formatPlatform(campaign.platform_type)}</span>
        <span>{formatCampaignType(campaign.campaign_type)}</span>
        <span>{formatRegion(campaign)}</span>
      </div>

      <div className="card-footer-grid">
        <div>
          <strong>{campaign.benefit_text || '혜택 확인 필요'}</strong>
          <span>제공 내역</span>
        </div>
        <div>
          <strong>{formatDeadline(campaign.apply_deadline)}</strong>
          <span>{deadlineState.label}</span>
        </div>
        <div>
          <strong>{campaign.recruit_count ? `${campaign.recruit_count}명` : '인원 미상'}</strong>
          <span>모집 인원</span>
        </div>
      </div>

      <div className="card-actions">
        <Link href={`/campaign/${campaign.id}`}>상세 보기</Link>
        <a href={campaign.original_url} target="_blank" rel="noreferrer">
          원문 이동
        </a>
      </div>
    </article>
  );
}
