import Link from 'next/link';
import { notFound } from 'next/navigation';

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
import { getCampaignById, getCampaignCount, getRelatedCampaigns, getVisitorCounts } from '@/lib/supabase';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';

export const dynamic = 'force-dynamic';

export default async function CampaignDetailPage({ params }) {
  const { id } = await params;
  const [campaign, counts, campaignCount] = await Promise.all([
    getCampaignById(id),
    getVisitorCounts(),
    getCampaignCount()
  ]);

  if (!campaign) {
    notFound();
  }

  const displayTitle = formatText(campaign.title);
  const confidence = getConfidence(campaign);
  const deadlineState = getDeadlineState(campaign.apply_deadline);
  const relatedCampaigns = await getRelatedCampaigns(campaign);
  const detailImage = getDetailImageSrc(campaign.thumbnail_url);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="detail-shell">
        <Link href="/" className="back-link">
          ← 목록으로
        </Link>

        <div className="detail-hero">
          <div className="detail-main-card">
            <div className="detail-media">
              {detailImage ? (
                <img src={detailImage} alt="" className="detail-image" />
              ) : (
                <div className="detail-image-fallback">{formatPlatform(campaign.platform_type)}</div>
              )}
            </div>
            <div className="card-meta-row">
              <span className="source-chip">{formatSourceName(campaign.sources)}</span>
              <span className={`badge badge-${confidence.tone}`}>{confidence.label}</span>
              <span className={`badge badge-${deadlineState.tone}`}>{deadlineState.label}</span>
            </div>
            <span className="detail-kicker">핵심 정보 먼저 보기</span>
            <h1>{displayTitle}</h1>
            <p>{campaign.snippet || '혜택, 마감, 방문 조건을 먼저 보고 원문에서 세부를 확인하세요.'}</p>

            <div className="chip-row detail-subfacts">
              <span>{formatPlatform(campaign.platform_type)}</span>
              <span>{formatCampaignType(campaign.campaign_type)}</span>
              <span>{formatRegion(campaign)}</span>
            </div>

            <div className="detail-summary-grid">
              <div className="detail-summary-card">
                <span>혜택</span>
                <strong>{campaign.benefit_text || '미공개'}</strong>
              </div>
              <div className="detail-summary-card">
                <span>마감일</span>
                <strong>{formatDeadline(campaign.apply_deadline)}</strong>
                <small>{deadlineState.label}</small>
              </div>
              <div className="detail-summary-card">
                <span>모집 인원</span>
                <strong>{campaign.recruit_count ? `${campaign.recruit_count}명` : '미공개'}</strong>
              </div>
            </div>
          </div>

          <aside className="decision-panel">
            <div>
              <span>제공 혜택</span>
              <strong>{campaign.benefit_text || '미공개'}</strong>
            </div>
            <div>
              <span>마감일</span>
              <strong>{formatDeadline(campaign.apply_deadline)}</strong>
            </div>
            <div>
              <span>모집 인원</span>
              <strong>{campaign.recruit_count ? `${campaign.recruit_count}명` : '미공개'}</strong>
            </div>
            <div className="detail-notice">
              지역·예약·추가 비용은 원문에서 볼 수 있어요.
            </div>
            <div className="decision-actions">
              <a href={campaign.original_url} target="_blank" rel="noreferrer" className="primary-action">
                원문 보기
              </a>
              <Link href="/#explore" className="secondary-link">다른 캠페인 더 보기</Link>
            </div>
          </aside>
        </div>

        <section className="detail-grid">
          <article className="info-panel">
            <h2>핵심 정보</h2>
            <dl>
              <div>
                <dt>출처</dt>
                <dd>{formatSourceName(campaign.sources)}</dd>
              </div>
              <div>
                <dt>유형</dt>
                <dd>{formatCampaignType(campaign.campaign_type)}</dd>
              </div>
              <div>
                <dt>지역</dt>
                <dd>{formatRegion(campaign)}</dd>
              </div>
              <div>
                <dt>마지막 갱신</dt>
                <dd>{new Date(campaign.last_seen_at).toLocaleString('ko-KR')}</dd>
              </div>
              <div>
                <dt>원문 링크</dt>
                <dd className="break-anywhere">{campaign.original_url}</dd>
              </div>
            </dl>
          </article>

          <article className="info-panel">
            <h2>읽는 팁</h2>
            <ul>
              <li>정보가 비어 있으면 원문에서 한 번 더 살펴보세요.</li>
              <li>지역 정보가 없으면 방문 가능 여부를 원문에서 확인하세요.</li>
              <li>지원은 언제나 외부 원문 페이지에서 진행돼요.</li>
            </ul>
          </article>
        </section>

        <section className="decision-checklist">
          <div className="guidance-card">
            <strong>혜택이 보여요?</strong>
            <span>제공 범위가 흐리면 원문에서 한 번 더 보세요.</span>
          </div>
          <div className="guidance-card">
            <strong>마감이 임박했나요?</strong>
            <span>오늘·내일 마감이면 바로 원문을 여는 편이 좋아요.</span>
          </div>
          <div className="guidance-card">
            <strong>방문 조건이 맞나요?</strong>
            <span>지역이 비어 있으면 매장 위치와 예약 조건을 원문에서 확인하세요.</span>
          </div>
        </section>

        <section className="related-panel">
          <div className="section-headline compact-headline compact-single">
            <div>
              <span className="eyebrow">비슷한 캠페인</span>
              <h2>같이 볼 만한 캠페인</h2>
            </div>
          </div>
          {relatedCampaigns.length ? (
            <div className="related-list">
              {relatedCampaigns.map((item) => (
                <article key={item.id} className="related-card">
                  <div>
                    <span className="source-chip">{formatSourceName(item.sources)}</span>
                    <h3>{formatText(item.title)}</h3>
                    <p>{formatRegion(item)} · {formatDeadline(item.apply_deadline)}</p>
                  </div>
                  <Link href={`/campaign/${item.id}`}>상세 보기</Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <p>비슷한 캠페인이 아직 없어요. 새로 들어오면 바로 보여드릴게요.</p>
            </div>
          )}
        </section>
      </section>
    </SiteShell>
  );
}

function getDetailImageSrc(value) {
  if (!value) {
    return null;
  }

  if (value.includes('dq-files.gcdn.ntruss.com')) {
    return `/api/image?src=${encodeURIComponent(value)}`;
  }

  return value;
}
