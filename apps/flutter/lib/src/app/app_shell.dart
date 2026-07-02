part of '../../main.dart';

enum AppSection { explore, map, saved, board }

extension AppSectionData on AppSection {
  String get routePath => switch (this) {
    AppSection.explore => '/',
    AppSection.map => '/map',
    AppSection.saved => '/saved',
    AppSection.board => '/board',
  };

  String get topLabel => switch (this) {
    AppSection.explore => '목록',
    AppSection.map => '체험단 지도',
    AppSection.saved => '저장',
    AppSection.board => '게시판',
  };

  String get bottomLabel => switch (this) {
    AppSection.explore => '탐색',
    AppSection.map => '지도',
    AppSection.saved => '저장',
    AppSection.board => '게시판',
  };

  IconData get icon => switch (this) {
    AppSection.explore => Icons.home_outlined,
    AppSection.map => Icons.map_outlined,
    AppSection.saved => Icons.bookmark_border,
    AppSection.board => Icons.chat_bubble_outline,
  };

  IconData get selectedIcon => switch (this) {
    AppSection.explore => Icons.home,
    AppSection.map => Icons.map,
    AppSection.saved => Icons.bookmark,
    AppSection.board => Icons.chat_bubble,
  };
}

const topLevelSections = [AppSection.explore, AppSection.map, AppSection.board];

AppSection appSectionFromRoute(String? routeName) {
  return AppSection.values.firstWhere(
    (section) => section.routePath == routeName,
    orElse: () => AppSection.explore,
  );
}

class ReviewersHome extends StatefulWidget {
  const ReviewersHome({this.initialSection = AppSection.explore, super.key});

  final AppSection initialSection;

  @override
  State<ReviewersHome> createState() => _ReviewersHomeState();
}

class _ReviewersHomeState extends State<ReviewersHome> {
  final SupabaseCampaignRepository _repository = SupabaseCampaignRepository(
    supabaseUrl: _supabaseUrl,
    anonKey: _supabaseAnonKey,
  );
  final SupabaseBoardRepository _boardRepository = SupabaseBoardRepository(
    supabaseUrl: _supabaseUrl,
    anonKey: _supabaseAnonKey,
  );
  final SavedCampaignStore _savedStore = SavedCampaignStore();
  late AppSection _section;
  Campaign? _selectedCampaign;

  @override
  void initState() {
    super.initState();
    _section = widget.initialSection;
  }

  @override
  Widget build(BuildContext context) {
    final hasDetail = _selectedCampaign != null;
    return Scaffold(
      appBar: AppBar(
        shape: const Border(bottom: BorderSide(color: RkColor.line)),
        titleSpacing: 16,
        title: Row(
          children: [
            GestureDetector(
              onTap: () => setState(() {
                _selectedCampaign = null;
                _section = AppSection.explore;
              }),
              child: const Text(
                '리뷰콕',
                style: TextStyle(
                  color: RkColor.ink900,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TopTabs(
                section: _section,
                onSelect: (section) => setState(() {
                  _selectedCampaign = null;
                  _section = section;
                }),
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        top: false,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 180),
          child: hasDetail
              ? CampaignDetailScreen(
                  key: ValueKey(_selectedCampaign!.id),
                  campaign: _selectedCampaign!,
                  repository: _repository,
                  savedStore: _savedStore,
                  onBack: () => setState(() => _selectedCampaign = null),
                  onOpen: (campaign) =>
                      setState(() => _selectedCampaign = campaign),
                )
              : switch (_section) {
                  AppSection.explore => ExploreScreen(
                    repository: _repository,
                    savedStore: _savedStore,
                    onOpen: (campaign) =>
                        setState(() => _selectedCampaign = campaign),
                  ),
                  AppSection.map => MapScreen(
                    repository: _repository,
                    onOpen: (campaign) =>
                        setState(() => _selectedCampaign = campaign),
                  ),
                  AppSection.saved => SavedScreen(
                    repository: _repository,
                    savedStore: _savedStore,
                    onOpen: (campaign) =>
                        setState(() => _selectedCampaign = campaign),
                  ),
                  AppSection.board => BoardScreen(repository: _boardRepository),
                },
        ),
      ),
      bottomNavigationBar: hasDetail
          ? null
          : Container(
              decoration: const BoxDecoration(
                color: RkColor.surface,
                border: Border(top: BorderSide(color: RkColor.line)),
              ),
              child: NavigationBar(
                selectedIndex: AppSection.values.indexOf(_section),
                onDestinationSelected: (index) =>
                    setState(() => _section = AppSection.values[index]),
                destinations: [
                  for (final section in AppSection.values)
                    NavigationDestination(
                      icon: Icon(section.icon),
                      selectedIcon: Icon(section.selectedIcon),
                      label: section.bottomLabel,
                    ),
                ],
              ),
            ),
    );
  }
}
