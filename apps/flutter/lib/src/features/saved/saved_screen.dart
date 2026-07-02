part of '../../../main.dart';

class SavedScreen extends StatefulWidget {
  const SavedScreen({
    required this.repository,
    required this.savedStore,
    required this.onOpen,
    super.key,
  });

  final SupabaseCampaignRepository repository;
  final SavedCampaignStore savedStore;
  final ValueChanged<Campaign> onOpen;

  @override
  State<SavedScreen> createState() => _SavedScreenState();
}

class _SavedScreenState extends State<SavedScreen> {
  late Future<List<Campaign>> _future;
  Set<String> _ids = {};

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Campaign>> _load() async {
    final ids = await widget.savedStore.readSavedIds();
    _ids = ids;
    if (ids.isEmpty) return [];
    return widget.repository.fetchCampaignsByIds(ids.toList());
  }

  void _reload() {
    setState(() => _future = _load());
  }

  Future<void> _remove(String id) async {
    await widget.savedStore.remove(id);
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => _reload(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        children: [
          AppHero(
            eyebrow: '저장한 캠페인',
            title: '나중에 다시 볼 체험단을 모아두세요.',
            body: 'Flutter 전환 버전에서는 계정 서버 없이 기기별 로컬 저장으로 먼저 제공합니다.',
          ),
          const SizedBox(height: 16),
          FutureBuilder<List<Campaign>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const CampaignSkeletonList(itemCount: 2);
              }
              if (snapshot.hasError) {
                return ErrorPanel(
                  message: '저장 목록을 불러오지 못했습니다.',
                  detail: '${snapshot.error}',
                  onRetry: _reload,
                );
              }
              final items = snapshot.data ?? const <Campaign>[];
              if (_ids.isEmpty || items.isEmpty) {
                return const EmptyPanel(
                  icon: Icons.bookmark_border,
                  title: '아직 저장한 캠페인이 없어요',
                  body: '마음에 드는 카드의 저장 버튼을 누르면 여기서 다시 볼 수 있어요.',
                );
              }
              return Column(
                children: [
                  for (final campaign in items) ...[
                    SavedCampaignTile(
                      campaign: campaign,
                      onOpen: () => widget.onOpen(campaign),
                      onRemove: () => _remove(campaign.id),
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
