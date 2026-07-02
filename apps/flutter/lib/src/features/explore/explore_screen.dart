part of '../../../main.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({
    required this.repository,
    required this.savedStore,
    required this.onOpen,
    super.key,
  });

  final SupabaseCampaignRepository repository;
  final SavedCampaignStore savedStore;
  final ValueChanged<Campaign> onOpen;

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _regionController = TextEditingController();
  FilterState _filters = const FilterState();
  late Future<List<Campaign>> _campaignsFuture;
  late Future<int> _countFuture;
  List<SourceInfo> _sources = const [];
  Set<String> _savedIds = {};
  bool _showAdvanced = false;

  @override
  void initState() {
    super.initState();
    _campaignsFuture = widget.repository.fetchCampaigns(_filters);
    _countFuture = widget.repository.countCampaigns(_filters);
    unawaited(_loadSupportData());
  }

  @override
  void dispose() {
    _searchController.dispose();
    _regionController.dispose();
    super.dispose();
  }

  Future<void> _loadSupportData() async {
    final values = await Future.wait([
      widget.repository.fetchSources().catchError((_) => <SourceInfo>[]),
      widget.savedStore.readSavedIds(),
    ]);
    if (!mounted) return;
    setState(() {
      _sources = values[0] as List<SourceInfo>;
      _savedIds = values[1] as Set<String>;
    });
  }

  void _reload({bool resetOffset = true}) {
    if (resetOffset) {
      _filters = _filters.copyWith(offset: 0);
    }
    setState(() {
      _campaignsFuture = widget.repository.fetchCampaigns(_filters);
      _countFuture = widget.repository.countCampaigns(_filters);
    });
  }

  void _applyTextFilters() {
    _filters = _filters.copyWith(
      search: _searchController.text.trim(),
      region: _regionController.text.trim(),
      offset: 0,
    );
    _reload(resetOffset: false);
  }

  Future<void> _toggleSaved(Campaign campaign) async {
    final next = await widget.savedStore.toggle(campaign.id);
    if (!mounted) return;
    setState(() => _savedIds = next);
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
            eyebrow: '체험단 탐색',
            title: '혜택, 마감, 지역부터 빠르게 비교하세요.',
            body:
                '기존 웹의 캠페인 목록과 필터 흐름을 Flutter web, iOS, Android에서 같은 방식으로 볼 수 있게 옮겼습니다.',
          ),
          const SizedBox(height: RkSpace.x4),
          FilterPanel(
            filters: _filters,
            sources: _sources,
            searchController: _searchController,
            regionController: _regionController,
            showAdvanced: _showAdvanced,
            onAdvancedToggle: () =>
                setState(() => _showAdvanced = !_showAdvanced),
            onChanged: (filters) {
              _filters = filters;
              _reload();
            },
            onSubmit: _applyTextFilters,
          ),
          const SizedBox(height: RkSpace.x4),
          FutureBuilder<int>(
            future: _countFuture,
            builder: (context, snapshot) {
              final text = snapshot.hasData
                  ? '${formatCount(snapshot.data!)}개 캠페인'
                  : '캠페인 불러오는 중';
              return Container(
                padding: const EdgeInsets.all(RkSpace.x3),
                decoration: BoxDecoration(
                  color: RkColor.sunken,
                  border: Border.all(color: RkColor.line),
                  borderRadius: BorderRadius.circular(RkRadius.lg),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.fact_check_outlined,
                      size: 18,
                      color: RkColor.primaryText,
                    ),
                    const SizedBox(width: RkSpace.x2),
                    Expanded(
                      child: Text(
                        text,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    const StatusPill(label: '활성 목록', tone: PillTone.accent),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: RkSpace.x3),
          FutureBuilder<List<Campaign>>(
            future: _campaignsFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const CampaignSkeletonList();
              }
              if (snapshot.hasError) {
                return ErrorPanel(
                  message: widget.repository.isConfigured
                      ? '캠페인을 불러오지 못했습니다.'
                      : 'Supabase 환경값이 필요합니다. --dart-define으로 SUPABASE_URL과 SUPABASE_ANON_KEY를 전달하세요.',
                  detail: '${snapshot.error}',
                  onRetry: _reload,
                );
              }
              final campaigns = snapshot.data ?? const [];
              if (campaigns.isEmpty) {
                return const EmptyPanel(
                  icon: Icons.search_off,
                  title: '조건에 맞는 캠페인이 없어요',
                  body: '검색어나 필터를 줄이면 더 많은 체험단을 볼 수 있어요.',
                );
              }
              return Column(
                children: [
                  for (final campaign in campaigns) ...[
                    CampaignCard(
                      campaign: campaign,
                      saved: _savedIds.contains(campaign.id),
                      onSaved: () => _toggleSaved(campaign),
                      onOpen: () => widget.onOpen(campaign),
                    ),
                    const SizedBox(height: RkSpace.x3),
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
