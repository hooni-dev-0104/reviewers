import Link from 'next/link';

import {
  formatCampaignType,
  formatDeadline,
  formatPlatform,
  formatRegion,
  formatSourceName,
  formatSourceTone,
  formatText,
  getConfidence,
  getDeadlineState
} from '@/lib/format';

export function CampaignCard({ campaign }) {
  const confidence = getConfidence(campaign);
  const deadlineState = getDeadlineState(campaign.apply_deadline);
  const sourceSlug = campaign.sources?.slug || 'unknown';
  const confidenceLabel = getConfidenceLabel(confidence.label);
  const title = formatText(campaign.title);
  const summary = pickSummary(campaign);
  const reward = campaign.benefit_text || '혜택 확인 필요';
  const deadline = formatDeadline(campaign.apply_deadline);
  const slots = campaign.recruit_count ? `${campaign.recruit_count}명` : '인원 미상';
  const thumbnailSrc = getThumbnailSrc(campaign.thumbnail_url);

  return (
    <article className={`campaign-card tone-${formatSourceTone(sourceSlug)}`}>
      <Link
        href={`/campaign/${campaign.id}`}
        className={`card-visual ${campaign.thumbnail_url ? 'has-image' : 'no-image'}`}
        aria-label={`${title} 상세 보기`}
      >
        {thumbnailSrc ? (
          <img src={thumbnailSrc} alt="" className="card-image" loading="lazy" />
        ) : (
          <div className="card-image-fallback" aria-hidden="true">
            <span>{formatPlatform(campaign.platform_type)}</span>
          </div>
        )}

        <div className="card-topline">
          <span className="source-chip">{formatSourceName(campaign.sources)}</span>
          <span className={`badge badge-${confidence.tone}`}>{confidenceLabel}</span>
        </div>
      </Link>

      <Link href={`/campaign/${campaign.id}`} className="card-link-block">
        <h3>{title}</h3>
        <p>{summary}</p>
      </Link>

      <div className="chip-row card-chip-row">
        <span>{formatPlatform(campaign.platform_type)}</span>
        <span>{formatCampaignType(campaign.campaign_type)}</span>
        <span>{formatRegion(campaign)}</span>
      </div>

      <div className="card-fact-grid">
        <div className="fact-card fact-card-wide">
          <span>혜택</span>
          <strong>{reward}</strong>
        </div>
        <div className="fact-card">
          <span>모집 마감</span>
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
      </div>
    </article>
  );
}

function getConfidenceLabel(label) {
  return {
    '조건 확인됨': '조건 확인됨',
    '일부 정보 확인 필요': '일부 정보 확인 필요',
    '원문 확인 권장': '원문 확인 권장'
  }[label] || label;
}

function pickSummary(campaign) {
  const title = formatText(campaign.title);
  const snippet = formatText(campaign.snippet);
  const prioritySummary = '혜택·마감·지역을 먼저 확인해 보세요.';

  if (!snippet) {
    return prioritySummary;
  }

  if (snippet === title || snippet.replaceAll(' ', '') === title.replaceAll(' ', '')) {
    return prioritySummary;
  }

  return snippet;
}

function getThumbnailSrc(value) {
  if (!value) {
    return null;
  }

  if (value.includes('dq-files.gcdn.ntruss.com')) {
    return `/api/image?src=${encodeURIComponent(value)}`;
  }

  return value;
}
