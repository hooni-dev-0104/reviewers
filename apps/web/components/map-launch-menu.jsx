import { getKakaoMapSearchUrl, getMapSearchQuery, getNaverMapSearchUrl } from '@/lib/format';

export function MapLaunchMenu({ campaign, className = '' }) {
  const query = getMapSearchQuery(campaign);
  const kakaoUrl = getKakaoMapSearchUrl(campaign);
  const naverUrl = getNaverMapSearchUrl(campaign);

  if (!query || !kakaoUrl || !naverUrl) {
    return null;
  }

  return (
    <details className={`map-launch-menu ${className}`.trim()}>
      <summary className="map-trigger" aria-label={`${query} 지도 보기`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s6-5.686 6-11a6 6 0 1 0-12 0c0 5.314 6 11 6 11Zm0-8.25A2.75 2.75 0 1 1 12 7.25a2.75 2.75 0 0 1 0 5.5Z" />
        </svg>
      </summary>
      <div className="map-popover">
        <strong>지도에서 보기</strong>
        <a href={kakaoUrl} target="_blank" rel="noreferrer">
          카카오맵
        </a>
        <a href={naverUrl} target="_blank" rel="noreferrer">
          네이버지도
        </a>
      </div>
    </details>
  );
}
