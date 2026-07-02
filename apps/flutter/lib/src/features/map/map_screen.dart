part of '../../../main.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({required this.repository, required this.onOpen, super.key});

  final SupabaseCampaignRepository repository;
  final ValueChanged<Campaign> onOpen;

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  late Future<List<Campaign>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repository.fetchMapCampaigns();
  }

  void _reload() {
    setState(() => _future = widget.repository.fetchMapCampaigns());
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => _reload(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(
          RkSpace.x4,
          RkSpace.x2,
          RkSpace.x4,
          96,
        ),
        children: [
          AppHero(
            eyebrow: '체험단 지도',
            title: '방문형 캠페인을 지역 기준으로 살펴보세요.',
            body: '모바일에서는 카카오맵/네이버 지도 검색으로 이어지는 경량 지도 흐름을 제공합니다.',
          ),
          const SizedBox(height: RkSpace.x4),
          FutureBuilder<List<Campaign>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const CampaignSkeletonList();
              }
              if (snapshot.hasError) {
                return ErrorPanel(
                  message: '지도 캠페인을 불러오지 못했습니다.',
                  detail: '${snapshot.error}',
                  onRetry: _reload,
                );
              }
              final items = snapshot.data ?? const <Campaign>[];
              if (items.isEmpty) {
                return const EmptyPanel(
                  icon: Icons.map_outlined,
                  title: '표시할 방문형 캠페인이 없어요',
                  body: '지도에 올릴 위치 정보가 있는 캠페인이 들어오면 이곳에 보여줍니다.',
                );
              }
              return Column(
                children: [
                  MapOverviewPanel(campaigns: items),
                  const SizedBox(height: RkSpace.x3),
                  for (final campaign in items) ...[
                    MapCampaignTile(
                      campaign: campaign,
                      onOpen: () => widget.onOpen(campaign),
                    ),
                    const SizedBox(height: 10),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class MapOverviewPanel extends StatelessWidget {
  const MapOverviewPanel({required this.campaigns, super.key});

  final List<Campaign> campaigns;

  @override
  Widget build(BuildContext context) {
    final regions = <String>{};
    for (final campaign in campaigns) {
      if (campaign.regionPrimary != null) {
        regions.add(campaign.regionPrimary!);
      }
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(RkSpace.x4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.travel_explore, color: RkColor.primaryText),
                const SizedBox(width: RkSpace.x2),
                Text(
                  '지도 후보 ${formatCount(campaigns.length)}개',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Spacer(),
                const StatusPill(label: '방문형', tone: PillTone.accent),
              ],
            ),
            const SizedBox(height: RkSpace.x2),
            Text(
              regions.isEmpty
                  ? '정확한 위치가 있는 방문형 캠페인을 마감순으로 보여줍니다.'
                  : '${regions.take(6).join(', ')} 지역의 방문형 캠페인을 마감순으로 보여줍니다.',
              style: const TextStyle(color: RkColor.ink500),
            ),
          ],
        ),
      ),
    );
  }
}
