part of '../../../main.dart';

class CampaignCard extends StatelessWidget {
  const CampaignCard({
    required this.campaign,
    required this.saved,
    required this.onSaved,
    required this.onOpen,
    super.key,
  });

  final Campaign campaign;
  final bool saved;
  final VoidCallback onSaved;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final deadlineState = campaign.deadlineState;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onOpen,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CampaignImage(campaign: campaign, height: 160),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      SourcePill(source: campaign.sourceName),
                      const SizedBox(width: 8),
                      StatusPill(
                        label: campaign.confidenceLabel,
                        tone: campaign.requiresReview
                            ? PillTone.warning
                            : PillTone.ok,
                      ),
                      const Spacer(),
                      IconButton(
                        tooltip: saved ? '저장 해제' : '저장',
                        onPressed: onSaved,
                        icon: Icon(
                          saved ? Icons.bookmark : Icons.bookmark_border,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    campaign.cleanTitle,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    campaign.summary,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF6B665D),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      MetaChip(
                        icon: campaign.platformIcon,
                        label: campaign.platformLabel,
                      ),
                      MetaChip(
                        icon: campaign.typeIcon,
                        label: campaign.typeLabel,
                      ),
                      MetaChip(
                        icon: Icons.place_outlined,
                        label: campaign.regionLabel,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  BenefitBox(text: campaign.benefitText ?? '혜택 정보 미공개'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      StatusPill(
                        label:
                            '${campaign.deadlineLabel} · ${deadlineState.label}',
                        tone: deadlineState.tone,
                        icon: Icons.schedule,
                      ),
                      const SizedBox(width: 8),
                      MetaChip(
                        icon: Icons.group_outlined,
                        label: campaign.recruitLabel,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
