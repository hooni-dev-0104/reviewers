part of '../../../main.dart';

class AppHero extends StatelessWidget {
  const AppHero({
    required this.eyebrow,
    required this.title,
    required this.body,
    super.key,
  });

  final String eyebrow;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              eyebrow,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: Color(0xFF2B5FE3),
              ),
            ),
            const SizedBox(height: 8),
            Text(title, style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 8),
            Text(body, style: Theme.of(context).textTheme.bodyLarge),
          ],
        ),
      ),
    );
  }
}

class CampaignImage extends StatelessWidget {
  const CampaignImage({
    required this.campaign,
    required this.height,
    super.key,
  });

  final Campaign campaign;
  final double height;

  @override
  Widget build(BuildContext context) {
    final url = campaign.thumbnailUrl;
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
      child: SizedBox(
        height: height,
        width: double.infinity,
        child: url == null
            ? ImageFallback(
                label: campaign.platformLabel,
                icon: campaign.platformIcon,
              )
            : Image.network(
                url,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => ImageFallback(
                  label: campaign.platformLabel,
                  icon: campaign.platformIcon,
                ),
              ),
      ),
    );
  }
}

class ImageFallback extends StatelessWidget {
  const ImageFallback({required this.label, required this.icon, super.key});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFEAF0FE),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 32, color: const Color(0xFF1D49B8)),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                color: Color(0xFF1D49B8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BenefitBox extends StatelessWidget {
  const BenefitBox({required this.text, super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFCF1E4),
        border: Border.all(color: const Color(0xFFF0DDC7)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.card_giftcard, size: 18, color: Color(0xFF935A23)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: Color(0xFF935A23),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class MetaChip extends StatelessWidget {
  const MetaChip({required this.icon, required this.label, super.key});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE7E4DD)),
        color: const Color(0xFFFAF9F6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: const Color(0xFF6B665D)),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: Color(0xFF6B665D),
            ),
          ),
        ],
      ),
    );
  }
}

enum PillTone { ok, warning, danger, muted, accent }

class StatusPill extends StatelessWidget {
  const StatusPill({
    required this.label,
    required this.tone,
    this.icon,
    super.key,
  });

  final String label;
  final PillTone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final colors = switch (tone) {
      PillTone.ok => (const Color(0xFFE2F3EA), const Color(0xFF0C6E49)),
      PillTone.warning => (const Color(0xFFFAEFD8), const Color(0xFF8A5410)),
      PillTone.danger => (const Color(0xFFFCEAE8), const Color(0xFFB42820)),
      PillTone.accent => (const Color(0xFFEAF0FE), const Color(0xFF1D49B8)),
      PillTone.muted => (const Color(0xFFF1EFEA), const Color(0xFF6B665D)),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: colors.$1,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: colors.$2),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: colors.$2,
            ),
          ),
        ],
      ),
    );
  }
}

class SourcePill extends StatelessWidget {
  const SourcePill({required this.source, super.key});

  final String source;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 7,
          height: 7,
          decoration: const BoxDecoration(
            color: Color(0xFF2B5FE3),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          source,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: Color(0xFF6B665D),
          ),
        ),
      ],
    );
  }
}

class SummaryTile extends StatelessWidget {
  const SummaryTile({
    required this.label,
    required this.value,
    this.helper,
    this.highlight = false,
    super.key,
  });

  final String label;
  final String value;
  final String? helper;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: highlight ? const Color(0xFFFCF1E4) : const Color(0xFFFAF9F6),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: highlight ? const Color(0xFFF0DDC7) : const Color(0xFFE7E4DD),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Color(0xFF6B665D),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
          ),
          if (helper != null) ...[
            const SizedBox(height: 4),
            Text(
              helper!,
              style: const TextStyle(fontSize: 12, color: Color(0xFF6B665D)),
            ),
          ],
        ],
      ),
    );
  }
}

class InfoPanel extends StatelessWidget {
  const InfoPanel({required this.campaign, super.key});

  final Campaign campaign;

  @override
  Widget build(BuildContext context) {
    final rows = [
      ('혜택', campaign.benefitText ?? '미공개'),
      ('출처', campaign.sourceName),
      ('유형', campaign.typeLabel),
      ('지역', campaign.regionLabel),
      ('원문 링크', campaign.originalUrl ?? '미공개'),
    ];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('상세정보', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            for (final row in rows)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 72,
                      child: Text(
                        row.$1,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF6B665D),
                        ),
                      ),
                    ),
                    Expanded(child: Text(row.$2)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class DecisionChecklist extends StatelessWidget {
  const DecisionChecklist({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        GuidanceCard(title: '혜택이 보여요?', body: '제공 범위가 흐리면 원문에서 한 번 더 보세요.'),
        SizedBox(height: 8),
        GuidanceCard(title: '마감이 임박했나요?', body: '오늘·내일 마감이면 바로 원문을 여는 편이 좋아요.'),
        SizedBox(height: 8),
        GuidanceCard(
          title: '방문 조건이 맞나요?',
          body: '지역이 비어 있으면 매장 위치와 예약 조건을 원문에서 확인하세요.',
        ),
      ],
    );
  }
}

class GuidanceCard extends StatelessWidget {
  const GuidanceCard({required this.title, required this.body, super.key});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Color(0xFF138A5E)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 2),
                  Text(body, style: const TextStyle(color: Color(0xFF6B665D))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class RelatedCampaignRow extends StatelessWidget {
  const RelatedCampaignRow({
    required this.campaign,
    required this.onTap,
    super.key,
  });

  final Campaign campaign;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        title: Text(
          campaign.cleanTitle,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text('${campaign.regionLabel} · ${campaign.deadlineLabel}'),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}

class MapCampaignTile extends StatelessWidget {
  const MapCampaignTile({
    required this.campaign,
    required this.onOpen,
    super.key,
  });

  final Campaign campaign;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SourcePill(source: campaign.sourceName),
            const SizedBox(height: 8),
            Text(
              campaign.cleanTitle,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              campaign.exactLocation ?? campaign.regionLabel,
              style: const TextStyle(color: Color(0xFF6B665D)),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onOpen,
                    icon: const Icon(Icons.info_outline),
                    label: const Text('상세'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => openMapSearch(campaign),
                    icon: const Icon(Icons.map),
                    label: const Text('지도 열기'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class SavedCampaignTile extends StatelessWidget {
  const SavedCampaignTile({
    required this.campaign,
    required this.onOpen,
    required this.onRemove,
    super.key,
  });

  final Campaign campaign;
  final VoidCallback onOpen;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.all(14),
        title: Text(
          campaign.cleanTitle,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              MetaChip(
                icon: campaign.platformIcon,
                label: campaign.platformLabel,
              ),
              MetaChip(icon: Icons.place_outlined, label: campaign.regionLabel),
              MetaChip(icon: Icons.schedule, label: campaign.deadlineLabel),
            ],
          ),
        ),
        trailing: IconButton(
          onPressed: onRemove,
          icon: const Icon(Icons.delete_outline),
          tooltip: '저장 삭제',
        ),
        onTap: onOpen,
      ),
    );
  }
}

class BoardNoticeCard extends StatelessWidget {
  const BoardNoticeCard({
    required this.title,
    required this.body,
    required this.icon,
    super.key,
  });

  final String title;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: const Color(0xFF2B5FE3)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(body),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CampaignSkeletonList extends StatelessWidget {
  const CampaignSkeletonList({this.itemCount = 4, super.key});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < itemCount; i++) ...[
          Container(
            height: 180,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFE7E4DD)),
            ),
            child: const Center(child: CircularProgressIndicator()),
          ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class EmptyPanel extends StatelessWidget {
  const EmptyPanel({
    required this.icon,
    required this.title,
    required this.body,
    super.key,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(icon, size: 36, color: const Color(0xFF97928A)),
            const SizedBox(height: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              body,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF6B665D)),
            ),
          ],
        ),
      ),
    );
  }
}

class ErrorPanel extends StatelessWidget {
  const ErrorPanel({
    required this.message,
    required this.detail,
    required this.onRetry,
    super.key,
  });

  final String message;
  final String detail;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(detail, style: const TextStyle(color: Color(0xFFB42820))),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('다시 시도'),
            ),
          ],
        ),
      ),
    );
  }
}
