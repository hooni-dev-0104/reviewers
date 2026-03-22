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
import { SavedCampaignButton } from '@/components/saved-campaign-button';

export function CampaignCard({ campaign }) {
  const confidence = getConfidence(campaign);
  const deadlineState = getDeadlineState(campaign.apply_deadline);
  const sourceSlug = campaign.sources?.slug || 'unknown';
  const summary = pickSummary(campaign);
  const reward = campaign.benefit_text || '혜택 확인 필요';
  const deadline = formatDeadline(campaign.apply_deadline);
  const slots = campaign.recruit_count ? `${campaign.recruit_count}명` : '인원 미상';

  return (
    <article className={`campaign-card tone-${formatSourceTone(sourceSlug)}`}>
      <div className="card-topline">
        <span className="source-chip">{formatSourceName(campaign.sources)}</span>
        <span className={`badge badge-${confidence.tone}`}>{confidence.label}</span>
      </div>

      <Link href={`/campaign/${campaign.id}`} className="card-link-block">
        <h3>{campaign.title}</h3>
        <p>{summary}</p>
      </Link>

      <div className="chip-row card-chip-row">
        <span>{formatPlatform(campaign.platform_type)}</span>
        <span>{formatCampaignType(campaign.campaign_type)}</span>
        <span>{formatRegion(campaign)}</span>
      </div>

      <div className="card-fact-grid">
        <div className="fact-card fact-card-wide">
          <span>제공 내역</span>
          <strong>{reward}</strong>
        </div>
        <div className="fact-card">
          <span>마감일</span>
          <strong>{deadline}</strong>
          <small>{deadlineState.label}</small>
        </div>
        <div className="fact-card">
          <span>모집 인원</span>
          <strong>{slots}</strong>
        </div>
      </div>

      <div className="card-actions">
        <Link href={`/campaign/${campaign.id}`}>상세 보기</Link>
        <SavedCampaignButton campaignId={campaign.id} />
        <a href={campaign.original_url} target="_blank" rel="noreferrer">
          원문 이동
        </a>
      </div>
    </article>
  );
}

function pickSummary(campaign) {
  const title = String(campaign.title || '').trim();
  const snippet = String(campaign.snippet || '').trim();

  if (!snippet) {
    return '클릭 전에 핵심 조건을 빠르게 확인하고, 원문에서 최종 조건만 검증해보세요.';
  }

  if (snippet === title || snippet.replaceAll(' ', '') === title.replaceAll(' ', '')) {
    return `${formatRegion(campaign)} · ${formatPlatform(campaign.platform_type)} · ${formatCampaignType(campaign.campaign_type)}`;
  }

  return snippet;
}
