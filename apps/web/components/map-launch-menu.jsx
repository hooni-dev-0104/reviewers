import { cn } from '@/lib/ui';
import { getInternalMapLaunchUrl, supportsExactMap } from '@/lib/format';

export function MapLaunchMenu({ campaign, className = '' }) {
  const kakaoUrl = getInternalMapLaunchUrl(campaign, 'kakao');

  if (!supportsExactMap(campaign) || !campaign?.exact_location || !kakaoUrl) {
    return null;
  }

  return (
    <a
      href={kakaoUrl}
      target="_blank"
      rel="noreferrer"
      className={cn('text-current', className)}
      aria-label={`${campaign.exact_location} 카카오맵에서 보기`}
      title="카카오맵에서 보기"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M12 21s6-5.686 6-11a6 6 0 1 0-12 0c0 5.314 6 11 6 11Zm0-8.25A2.75 2.75 0 1 1 12 7.25a2.75 2.75 0 0 1 0 5.5Z" />
      </svg>
    </a>
  );
}
