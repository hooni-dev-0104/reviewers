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
        borderRadius: BorderRadius.circular(RkRadius.lg),
        onTap: onOpen,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CampaignImage(campaign: campaign, height: 160),
            Padding(
              padding: const EdgeInsets.all(RkSpace.x4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Wrap(
                          spacing: RkSpace.x2,
                          runSpacing: RkSpace.x2,
                          children: [
                            SourcePill(source: campaign.sourceName),
                            StatusPill(
                              label: campaign.confidenceLabel,
                              tone: campaign.requiresReview
                                  ? PillTone.warning
                                  : PillTone.accent,
                              icon: campaign.requiresReview
                                  ? Icons.report_problem_outlined
                                  : Icons.verified_outlined,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: saved ? '저장 해제' : '저장',
                        onPressed: onSaved,
                        icon: Icon(
                          saved ? Icons.bookmark : Icons.bookmark_border,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: RkSpace.x3),
                  Text(
                    campaign.cleanTitle,
                    style: Theme.of(context).textTheme.titleLarge,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: RkSpace.x2),
                  Text(
                    campaign.summary,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: RkColor.ink500),
                  ),
                  const SizedBox(height: RkSpace.x3),
                  BenefitBox(text: campaign.benefitText ?? '혜택 정보 미공개'),
                  const SizedBox(height: RkSpace.x3),
                  Wrap(
                    spacing: RkSpace.x2,
                    runSpacing: RkSpace.x2,
                    children: [
                      StatusPill(
                        label:
                            '${campaign.deadlineLabel} · ${deadlineState.label}',
                        tone: deadlineState.tone,
                        icon: Icons.schedule,
                      ),
                      MetaChip(
                        icon: Icons.group_outlined,
                        label: campaign.recruitLabel,
                      ),
                    ],
                  ),
                  const SizedBox(height: RkSpace.x3),
                  Wrap(
                    spacing: RkSpace.x2,
                    runSpacing: RkSpace.x2,
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
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
