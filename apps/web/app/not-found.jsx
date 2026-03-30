import { ButtonLink, EmptyState } from '@/components/ui-kit';
import { containerClass } from '@/lib/ui';

export default function NotFound() {
  return (
    <main className={`${containerClass} flex min-h-screen items-center py-10 sm:py-16`}>
      <div className="w-full">
        <EmptyState
          title="찾으려던 캠페인을 못 찾았어요"
          description="캠페인이 만료되었거나 링크가 바뀌었을 수 있어요. 최신 목록에서 다시 탐색해보세요."
          actions={[<ButtonLink key="home" href="/" variant="primary">탐색으로 돌아가기</ButtonLink>]}
        />
      </div>
    </main>
  );
}
