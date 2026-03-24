'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { formatDeadline, formatRegion, formatSourceName, formatText, getInternalMapLaunchUrl } from '@/lib/format';

export function MapExplorer({ campaigns = [] }) {
  const [selectedId, setSelectedId] = useState(campaigns[0]?.id || null);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedId) || campaigns[0] || null,
    [campaigns, selectedId]
  );

  if (!campaigns.length) {
    return (
      <section className="map-empty-state">
        <h2>지도로 볼 수 있는 체험단이 아직 없어요</h2>
        <p>정확한 위치가 확인된 방문형 캠페인부터 이 탭에 보여드릴게요.</p>
      </section>
    );
  }

  const mapSrc = selectedCampaign?.exact_location
    ? `https://maps.google.com/maps?q=${encodeURIComponent(selectedCampaign.exact_location)}&z=16&output=embed`
    : null;
  const kakaoUrl = selectedCampaign ? getInternalMapLaunchUrl(selectedCampaign, 'kakao') : null;
  const naverUrl = selectedCampaign ? getInternalMapLaunchUrl(selectedCampaign, 'naver') : null;

  return (
    <section className="map-layout">
      <div className="map-canvas-panel">
        {selectedCampaign ? (
          <>
            <div className="map-canvas-head">
              <div>
                <span className="eyebrow">선택한 장소</span>
                <h2>{formatText(selectedCampaign.title)}</h2>
                <p>{selectedCampaign.exact_location}</p>
              </div>
              <div className="detail-map-links">
                <a href={kakaoUrl} target="_blank" rel="noreferrer">카카오맵</a>
                <a href={naverUrl} target="_blank" rel="noreferrer">네이버지도</a>
              </div>
            </div>
            {mapSrc ? (
              <iframe
                key={selectedCampaign.id}
                title={`${formatText(selectedCampaign.title)} 지도`}
                src={mapSrc}
                loading="lazy"
                className="map-embed-frame"
              />
            ) : null}
          </>
        ) : null}
      </div>

      <div className="map-list-panel">
        <div className="map-list-head">
          <span className="eyebrow">정확 위치 확인된 캠페인</span>
          <strong>{campaigns.length}개</strong>
        </div>
        <div className="map-card-list">
          {campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className={`map-list-card ${selectedCampaign?.id === campaign.id ? 'active' : ''}`}
            >
              <button
                type="button"
                className="map-list-select"
                onClick={() => setSelectedId(campaign.id)}
              >
                <span className="source-chip">{formatSourceName(campaign.sources)}</span>
                <h3>{formatText(campaign.title)}</h3>
                <p>{campaign.exact_location}</p>
                <small>{formatRegion(campaign)} · {formatDeadline(campaign.apply_deadline)}</small>
              </button>
              <Link href={`/campaign/${campaign.id}`}>
                상세 보기
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
