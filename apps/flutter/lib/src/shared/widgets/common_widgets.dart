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
    return Container(
      decoration: rkSurfaceDecoration(color: RkColor.surface, raised: true),
      child: Padding(
        padding: const EdgeInsets.all(RkSpace.x5),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              eyebrow,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: RkColor.primaryText,
              ),
            ),
            const SizedBox(height: RkSpace.x2),
            Text(title, style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: RkSpace.x2),
            Text(
              body,
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: RkColor.ink500),
            ),
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
      color: RkColor.primaryWeak,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 32, color: RkColor.primaryText),
            const SizedBox(height: RkSpace.x2),
            Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                color: RkColor.primaryText,
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
      padding: const EdgeInsets.all(RkSpace.x3),
      decoration: BoxDecoration(
        color: RkColor.rewardWeak,
        border: Border.all(color: RkColor.rewardLine),
        borderRadius: BorderRadius.circular(RkRadius.lg),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.card_giftcard, size: 18, color: RkColor.rewardText),
          const SizedBox(width: RkSpace.x2),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: RkColor.rewardText,
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
        borderRadius: BorderRadius.circular(RkRadius.pill),
        border: Border.all(color: RkColor.line),
        color: RkColor.sunken,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: RkColor.ink500),
          const SizedBox(width: RkSpace.x1),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: RkColor.ink500,
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
    final toneColors = switch (tone) {
      PillTone.ok => RkTone.success,
      PillTone.warning => RkTone.warning,
      PillTone.danger => RkTone.urgent,
      PillTone.accent => RkTone.trust,
      PillTone.muted => RkTone.neutral,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: toneColors.background,
        border: Border.all(color: toneColors.border),
        borderRadius: BorderRadius.circular(RkRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: toneColors.foreground),
            const SizedBox(width: RkSpace.x1),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: toneColors.foreground,
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: RkColor.primaryWeak,
        border: Border.all(color: RkColor.primaryWeak2),
        borderRadius: BorderRadius.circular(RkRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: RkColor.primary,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            source,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: RkColor.primaryText,
            ),
          ),
        ],
      ),
    );
  }
}

class SummaryTile extends StatelessWidget {
  const SummaryTile({
    required this.label,
    required this.value,
    this.helper,
    this.highlight = false,
    this.tone,
    super.key,
  });

  final String label;
  final String value;
  final String? helper;
  final bool highlight;
  final PillTone? tone;

  @override
  Widget build(BuildContext context) {
    final toneColors = switch (tone) {
      PillTone.ok => RkTone.success,
      PillTone.warning => RkTone.warning,
      PillTone.danger => RkTone.urgent,
      PillTone.accent => RkTone.trust,
      PillTone.muted => RkTone.neutral,
      null => null,
    };
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(RkSpace.x3),
      decoration: BoxDecoration(
        color: highlight
            ? RkColor.rewardWeak
            : toneColors?.background ?? RkColor.sunken,
        borderRadius: BorderRadius.circular(RkRadius.lg),
        border: Border.all(
          color: highlight
              ? RkColor.rewardLine
              : toneColors?.border ?? RkColor.line,
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
              color: RkColor.ink500,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              color: highlight
                  ? RkColor.rewardText
                  : toneColors?.foreground ?? RkColor.ink900,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
          if (helper != null) ...[
            const SizedBox(height: 4),
            Text(
              helper!,
              style: const TextStyle(fontSize: 12, color: RkColor.ink500),
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
        padding: const EdgeInsets.all(RkSpace.x4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('상세정보', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: RkSpace.x3),
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
                          color: RkColor.ink500,
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
        SizedBox(height: RkSpace.x2),
        GuidanceCard(title: '마감이 임박했나요?', body: '오늘·내일 마감이면 바로 원문을 여는 편이 좋아요.'),
        SizedBox(height: RkSpace.x2),
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
            const Icon(Icons.check_circle_outline, color: RkColor.success),
            const SizedBox(width: RkSpace.x3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 2),
                  Text(body, style: const TextStyle(color: RkColor.ink500)),
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
        contentPadding: const EdgeInsets.symmetric(
          horizontal: RkSpace.x4,
          vertical: RkSpace.x2,
        ),
        onTap: onTap,
        title: Text(
          campaign.cleanTitle,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: RkSpace.x2),
          child: Wrap(
            spacing: RkSpace.x2,
            runSpacing: RkSpace.x2,
            children: [
              MetaChip(icon: Icons.place_outlined, label: campaign.regionLabel),
              MetaChip(icon: Icons.schedule, label: campaign.deadlineLabel),
            ],
          ),
        ),
        trailing: const Icon(Icons.chevron_right, color: RkColor.ink400),
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
        padding: const EdgeInsets.all(RkSpace.x4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                SourcePill(source: campaign.sourceName),
                const Spacer(),
                StatusPill(
                  label: campaign.deadlineState.label,
                  tone: campaign.deadlineState.tone,
                  icon: Icons.schedule,
                ),
              ],
            ),
            const SizedBox(height: RkSpace.x3),
            Text(
              campaign.cleanTitle,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: RkSpace.x2),
            Text(
              campaign.exactLocation ?? campaign.regionLabel,
              style: const TextStyle(color: RkColor.ink500),
            ),
            const SizedBox(height: RkSpace.x3),
            BenefitBox(text: campaign.benefitText ?? '혜택 정보 미공개'),
            const SizedBox(height: RkSpace.x3),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onOpen,
                    icon: const Icon(Icons.info_outline),
                    label: const Text('상세'),
                  ),
                ),
                const SizedBox(width: RkSpace.x2),
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
        contentPadding: const EdgeInsets.all(RkSpace.x4),
        title: Text(
          campaign.cleanTitle,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: RkSpace.x2),
          child: Wrap(
            spacing: RkSpace.x2,
            runSpacing: RkSpace.x2,
            children: [
              SourcePill(source: campaign.sourceName),
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
          icon: const Icon(Icons.delete_outline, color: RkColor.warningText),
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
        padding: const EdgeInsets.all(RkSpace.x4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: RkColor.primaryText),
            const SizedBox(width: RkSpace.x3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: RkSpace.x1),
                  Text(body, style: const TextStyle(color: RkColor.ink500)),
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
            decoration: rkSurfaceDecoration(color: RkColor.surface),
            child: const Center(child: CircularProgressIndicator()),
          ),
          const SizedBox(height: RkSpace.x3),
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
    return Container(
      decoration: BoxDecoration(
        color: RkColor.sunken,
        border: Border.all(color: RkColor.lineStrong, style: BorderStyle.solid),
        borderRadius: BorderRadius.circular(RkRadius.lg),
      ),
      child: Padding(
        padding: const EdgeInsets.all(RkSpace.x5),
        child: Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: const BoxDecoration(
                color: RkColor.primaryWeak,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 28, color: RkColor.primaryText),
            ),
            const SizedBox(height: RkSpace.x3),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              body,
              textAlign: TextAlign.center,
              style: const TextStyle(color: RkColor.ink500),
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
        padding: const EdgeInsets.all(RkSpace.x4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: RkSpace.x2),
            Text(detail, style: const TextStyle(color: RkColor.dangerText)),
            const SizedBox(height: RkSpace.x3),
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
