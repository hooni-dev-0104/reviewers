import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  formatCampaignType,
  formatDeadline,
  formatPlatform,
  formatRegion,
  formatSourceName,
  getConfidence
} from '@/lib/format';
import { getCampaignById, getCampaignCount, getVisitorCounts } from '@/lib/supabase';
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

  const confidence = getConfidence(campaign);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="detail-shell">
        <Link href="/" className="back-link">
          ← 탐색으로 돌아가기
        </Link>

        <div className="detail-hero">
          <div className="detail-main-card">
            <div className="card-meta-row">
              <span className="source-chip">{formatSourceName(campaign.sources)}</span>
              <span className={`badge badge-${confidence.tone}`}>{confidence.label}</span>
            </div>
            <h1>{campaign.title}</h1>
            <p>{campaign.snippet || '원문 상세 페이지에서 미션과 신청 조건을 한 번 더 확인해보세요.'}</p>

            <div className="chip-row">
              <span>{formatPlatform(campaign.platform_type)}</span>
              <span>{formatCampaignType(campaign.campaign_type)}</span>
              <span>{formatRegion(campaign)}</span>
            </div>
          </div>

          <aside className="decision-panel">
            <div>
              <span>혜택</span>
              <strong>{campaign.benefit_text || '원문에서 확인 필요'}</strong>
            </div>
            <div>
              <span>모집 마감</span>
              <strong>{formatDeadline(campaign.apply_deadline)}</strong>
            </div>
            <div>
              <span>모집 인원</span>
              <strong>{campaign.recruit_count ? `${campaign.recruit_count}명` : '미공개'}</strong>
            </div>
            <a href={campaign.original_url} target="_blank" rel="noreferrer" className="primary-action">
              원문 열고 지원하기
            </a>
          </aside>
        </div>

        <section className="detail-grid">
          <article className="info-panel">
            <h2>지원 전에 체크할 정보</h2>
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
            </dl>
          </article>

          <article className="info-panel">
            <h2>신뢰 안내</h2>
            <ul>
              <li>검토 필요 배지가 있으면 마감일·혜택을 원문에서 다시 확인하세요.</li>
              <li>지역이 비어 있으면 실제 방문 가능 여부를 상세 원문에서 꼭 확인하세요.</li>
              <li>지원 액션은 원문 페이지에서 진행됩니다.</li>
            </ul>
          </article>
        </section>
      </section>
    </SiteShell>
  );
}
