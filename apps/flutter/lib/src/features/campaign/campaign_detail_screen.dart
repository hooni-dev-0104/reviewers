part of '../../../main.dart';

class CampaignDetailScreen extends StatefulWidget {
  const CampaignDetailScreen({
    required this.campaign,
    required this.repository,
    required this.savedStore,
    required this.onBack,
    required this.onOpen,
    super.key,
  });

  final Campaign campaign;
  final SupabaseCampaignRepository repository;
  final SavedCampaignStore savedStore;
  final VoidCallback onBack;
  final ValueChanged<Campaign> onOpen;

  @override
  State<CampaignDetailScreen> createState() => _CampaignDetailScreenState();
}

class _CampaignDetailScreenState extends State<CampaignDetailScreen> {
  late Future<List<Campaign>> _relatedFuture;
  Set<String> _savedIds = {};

  @override
  void initState() {
    super.initState();
    _relatedFuture = widget.repository.fetchRelatedCampaigns(widget.campaign);
    unawaited(_loadSaved());
  }

  Future<void> _loadSaved() async {
    final ids = await widget.savedStore.readSavedIds();
    if (mounted) setState(() => _savedIds = ids);
  }

  Future<void> _toggleSaved() async {
    final ids = await widget.savedStore.toggle(widget.campaign.id);
    if (mounted) setState(() => _savedIds = ids);
  }

  @override
  Widget build(BuildContext context) {
    final campaign = widget.campaign;
    final deadlineState = campaign.deadlineState;
    final saved = _savedIds.contains(campaign.id);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: widget.onBack,
            icon: const Icon(Icons.arrow_back),
            label: const Text('목록으로'),
          ),
        ),
        CampaignImage(campaign: campaign, height: 220),
        const SizedBox(height: 12),
        Card(
          child: Padding(
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
                      onPressed: _toggleSaved,
                      icon: Icon(
                        saved ? Icons.bookmark : Icons.bookmark_border,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  '핵심 정보 먼저 보기',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF2B5FE3),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  campaign.cleanTitle,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(campaign.summary),
                const SizedBox(height: 16),
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
                const SizedBox(height: 16),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final narrow = constraints.maxWidth < 560;
                    final cards = [
                      SummaryTile(
                        label: '혜택',
                        value: campaign.benefitText ?? '미공개',
                        highlight: true,
                      ),
                      SummaryTile(
                        label: '마감일',
                        value: campaign.deadlineLabel,
                        helper: deadlineState.label,
                      ),
                      SummaryTile(label: '모집 인원', value: campaign.recruitLabel),
                    ];
                    if (narrow) {
                      return Column(
                        children: cards
                            .map(
                              (card) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: card,
                              ),
                            )
                            .toList(),
                      );
                    }
                    return Row(
                      children: cards
                          .map(
                            (card) => Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: card,
                              ),
                            ),
                          )
                          .toList(),
                    );
                  },
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: campaign.originalUrl == null
                            ? null
                            : () => openExternal(campaign.originalUrl!),
                        icon: const Icon(Icons.open_in_new),
                        label: const Text('원문 보기'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton.icon(
                      onPressed: () => openMapSearch(campaign),
                      icon: const Icon(Icons.map_outlined),
                      label: const Text('지도'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        InfoPanel(campaign: campaign),
        const SizedBox(height: 16),
        const DecisionChecklist(),
        const SizedBox(height: 16),
        Text('같이 볼 만한 캠페인', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        FutureBuilder<List<Campaign>>(
          future: _relatedFuture,
          builder: (context, snapshot) {
            final items = snapshot.data ?? const <Campaign>[];
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const CampaignSkeletonList(itemCount: 2);
            }
            if (items.isEmpty) {
              return const EmptyPanel(
                icon: Icons.auto_awesome_outlined,
                title: '비슷한 캠페인이 아직 없어요',
                body: '새로 들어오면 바로 보여드릴게요.',
              );
            }
            return Column(
              children: [
                for (final item in items) ...[
                  RelatedCampaignRow(
                    campaign: item,
                    onTap: () => widget.onOpen(item),
                  ),
                  const SizedBox(height: 8),
                ],
              ],
            );
          },
        ),
      ],
    );
  }
}
