import Link from 'next/link';

import {
  formatCampaignType,
  formatDeadline,
  formatPlatform,
  formatRegion,
  formatSourceName,
  formatText,
  getConfidence,
  getDeadlineState
} from '@/lib/format';
import { MapLaunchMenu } from '@/components/map-launch-menu';
import { Badge, ButtonLink, Icon, Tag } from '@/components/ui';

const PLATFORM_ICON = {
  blog: 'pen-line',
  instagram: 'instagram',
  youtube: 'youtube',
  mixed: 'layout-grid'
};

const TYPE_ICON = {
  visit: 'store',
  delivery: 'truck',
  purchase: 'tag',
  content: 'pen-tool'
};

export function CampaignCard({ campaign }) {
  const deadlineState = getDeadlineState(campaign.apply_deadline);
  const confidence = getConfidence(campaign);
  const title = formatText(campaign.title) || '제목 미상';
  const summary = pickSummary(campaign);
  const reward = campaign.benefit_text || '혜택 정보 미공개';
  const deadline = formatDeadline(campaign.apply_deadline);
  const slots = campaign.recruit_count ? `${campaign.recruit_count}명` : '인원 미공개';
  const thumbnailSrc = getThumbnailSrc(campaign.thumbnail_url);
  const platformIcon = PLATFORM_ICON[campaign.platform_type] || 'layout-grid';
  const typeIcon = TYPE_ICON[campaign.campaign_type] || 'tag';

  return (
    <article className="rk-cc">
      <Link
        href={`/campaign/${campaign.id}`}
        className={`rk-cc__thumb ${thumbnailSrc ? 'has-image' : 'no-image'}`}
        aria-label={`${title} 상세 보기`}
      >
        {thumbnailSrc ? (
          <img src={thumbnailSrc} alt="" loading="lazy" />
        ) : (
          <span className="rk-cc__thumb-fallback" aria-hidden="true">
            <Icon name={platformIcon} size={22} />
            {formatPlatform(campaign.platform_type)}
          </span>
        )}
        {deadlineState.tone === 'danger' ? (
          <span className="rk-cc__pin"><Badge tone="urgent" solid>{deadlineState.label}</Badge></span>
        ) : null}
      </Link>

      <div className="rk-cc__body">
        <div className="rk-cc__head">
          <span className="rk-cc__source">
            <span className="rk-cc__source-dot" />
            {formatSourceName(campaign.sources)}
          </span>
          <Badge tone={confidence.tone} showIcon>{confidence.label}</Badge>
          <span className="rk-cc__head-spacer" />
          <MapLaunchMenu campaign={campaign} className="rk-cc__map" />
        </div>

        <Link href={`/campaign/${campaign.id}`} className="rk-cc__link">
          <h3>{title}</h3>
          <p>{summary}</p>
        </Link>

        <div className="rk-cc__meta">
          <Tag icon={platformIcon} plain>{formatPlatform(campaign.platform_type)}</Tag>
          <span className="rk-meta-sep" />
          <Tag icon={typeIcon} plain>{formatCampaignType(campaign.campaign_type)}</Tag>
          <span className="rk-meta-sep" />
          <Tag icon="map-pin" plain>{formatRegion(campaign)}</Tag>
        </div>

        <div className={['rk-cc__benefit', campaign.benefit_text ? '' : 'is-unknown'].filter(Boolean).join(' ')}>
          <Icon name={campaign.benefit_text ? 'gift' : 'info'} size={14} />
          <span>{reward}</span>
        </div>

        <div className="rk-cc__facts">
          <span className={`rk-deadline rk-deadline--${deadlineTone(deadlineState.tone)}`}>
            <Icon name="clock" size={13} />
            <span>{deadline}</span>
            <small>{deadlineState.label}</small>
          </span>
          <span className="rk-cc__fact">
            <Icon name="users" size={13} />
            <span className="tnum">{slots}</span>
          </span>
        </div>

        <div className="rk-cc__actions">
          <ButtonLink href={`/campaign/${campaign.id}`} variant="quiet" size="sm">상세 보기</ButtonLink>
        </div>
      </div>
    </article>
  );
}

function deadlineTone(tone) {
  if (tone === 'danger') return 'soon';
  if (tone === 'warn') return 'mid';
  if (tone === 'muted') return 'gone';
  return 'far';
}

function pickSummary(campaign) {
  const title = formatText(campaign.title);
  const snippet = formatText(campaign.snippet);
  const prioritySummary = '혜택·마감·지역부터 확인해보세요.';

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
