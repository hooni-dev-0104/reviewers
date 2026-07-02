import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

void main() {
  runApp(const ReviewersApp());
}

const _supabaseUrl = String.fromEnvironment(
  'SUPABASE_URL',
  defaultValue: String.fromEnvironment('NEXT_PUBLIC_SUPABASE_URL'),
);
const _supabaseAnonKey = String.fromEnvironment(
  'SUPABASE_ANON_KEY',
  defaultValue: String.fromEnvironment('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
);

class ReviewersApp extends StatelessWidget {
  const ReviewersApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '리뷰콕',
      debugShowCheckedModeBanner: false,
      theme: reviewKokTheme(),
      home: const ReviewersHome(),
    );
  }
}

ThemeData reviewKokTheme() {
  const ink = Color(0xFF1B1A17);
  const paper = Color(0xFFF7F6F3);
  const primary = Color(0xFF2B5FE3);
  final scheme = ColorScheme.fromSeed(
    seedColor: primary,
    brightness: Brightness.light,
    surface: Colors.white,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme.copyWith(
      primary: primary,
      surface: Colors.white,
      surfaceContainerLowest: paper,
      outline: const Color(0xFFE7E4DD),
      error: const Color(0xFFDA3B33),
    ),
    scaffoldBackgroundColor: paper,
    fontFamilyFallback: const [
      'Pretendard',
      'Apple SD Gothic Neo',
      'Malgun Gothic',
      'Roboto',
      'sans-serif',
    ],
    textTheme: const TextTheme(
      headlineLarge: TextStyle(
        fontSize: 28,
        height: 1.25,
        fontWeight: FontWeight.w800,
        color: ink,
      ),
      headlineMedium: TextStyle(
        fontSize: 22,
        height: 1.3,
        fontWeight: FontWeight.w800,
        color: ink,
      ),
      titleLarge: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w800,
        color: ink,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: ink,
      ),
      bodyLarge: TextStyle(
        fontSize: 15,
        height: 1.55,
        color: Color(0xFF36332D),
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        height: 1.5,
        color: Color(0xFF36332D),
      ),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: Color(0xFFE7E4DD)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFD8D4CB)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: primary, width: 1.4),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: const BorderSide(color: Color(0xFFD8D4CB)),
      ),
      backgroundColor: Colors.white,
      selectedColor: const Color(0xFFEAF0FE),
      labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(44, 44),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(44, 44),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        side: const BorderSide(color: Color(0xFFD8D4CB)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
      ),
    ),
  );
}

enum AppSection { explore, map, saved, board }

class ReviewersHome extends StatefulWidget {
  const ReviewersHome({super.key});

  @override
  State<ReviewersHome> createState() => _ReviewersHomeState();
}

class _ReviewersHomeState extends State<ReviewersHome> {
  final SupabaseCampaignRepository _repository = SupabaseCampaignRepository(
    supabaseUrl: _supabaseUrl,
    anonKey: _supabaseAnonKey,
  );
  final SavedCampaignStore _savedStore = SavedCampaignStore();
  AppSection _section = AppSection.explore;
  Campaign? _selectedCampaign;

  @override
  Widget build(BuildContext context) {
    final hasDetail = _selectedCampaign != null;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
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
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
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
                  AppSection.board => const BoardScreen(),
                },
        ),
      ),
      bottomNavigationBar: hasDetail
          ? null
          : NavigationBar(
              selectedIndex: AppSection.values.indexOf(_section),
              onDestinationSelected: (index) =>
                  setState(() => _section = AppSection.values[index]),
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.home_outlined),
                  selectedIcon: Icon(Icons.home),
                  label: '탐색',
                ),
                NavigationDestination(
                  icon: Icon(Icons.map_outlined),
                  selectedIcon: Icon(Icons.map),
                  label: '지도',
                ),
                NavigationDestination(
                  icon: Icon(Icons.bookmark_border),
                  selectedIcon: Icon(Icons.bookmark),
                  label: '저장',
                ),
                NavigationDestination(
                  icon: Icon(Icons.chat_bubble_outline),
                  selectedIcon: Icon(Icons.chat_bubble),
                  label: '게시판',
                ),
              ],
            ),
    );
  }
}

class TopTabs extends StatelessWidget {
  const TopTabs({required this.section, required this.onSelect, super.key});

  final AppSection section;
  final ValueChanged<AppSection> onSelect;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SegmentedButton<AppSection>(
        showSelectedIcon: false,
        selected: {section == AppSection.saved ? AppSection.explore : section},
        segments: const [
          ButtonSegment(value: AppSection.explore, label: Text('목록')),
          ButtonSegment(value: AppSection.map, label: Text('체험단 지도')),
          ButtonSegment(value: AppSection.board, label: Text('게시판')),
        ],
        onSelectionChanged: (value) => onSelect(value.first),
      ),
    );
  }
}

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
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        children: [
          AppHero(
            eyebrow: '체험단 탐색',
            title: '혜택, 마감, 지역부터 빠르게 비교하세요.',
            body:
                '기존 웹의 캠페인 목록과 필터 흐름을 Flutter web, iOS, Android에서 같은 방식으로 볼 수 있게 옮겼습니다.',
          ),
          const SizedBox(height: 16),
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
          const SizedBox(height: 16),
          FutureBuilder<int>(
            future: _countFuture,
            builder: (context, snapshot) {
              final text = snapshot.hasData
                  ? '${formatCount(snapshot.data!)}개 캠페인'
                  : '캠페인 불러오는 중';
              return Text(text, style: Theme.of(context).textTheme.titleMedium);
            },
          ),
          const SizedBox(height: 12),
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
                    const SizedBox(height: 12),
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

class FilterPanel extends StatelessWidget {
  const FilterPanel({
    required this.filters,
    required this.sources,
    required this.searchController,
    required this.regionController,
    required this.showAdvanced,
    required this.onAdvancedToggle,
    required this.onChanged,
    required this.onSubmit,
    super.key,
  });

  final FilterState filters;
  final List<SourceInfo> sources;
  final TextEditingController searchController;
  final TextEditingController regionController;
  final bool showAdvanced;
  final VoidCallback onAdvancedToggle;
  final ValueChanged<FilterState> onChanged;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: searchController,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (_) => onSubmit(),
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.search),
                      hintText: '브랜드, 지역, 혜택으로 검색',
                      labelText: '검색',
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(onPressed: onSubmit, child: const Text('검색')),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final option in platformOptions)
                  ChoiceChip(
                    label: Text(option.label),
                    avatar: Icon(option.icon, size: 18),
                    selected: filters.platforms.contains(option.value),
                    onSelected: (_) =>
                        onChanged(filters.togglePlatform(option.value)),
                  ),
                for (final option in deadlineOptions.skip(1))
                  ChoiceChip(
                    label: Text(option.label),
                    avatar: const Icon(Icons.schedule, size: 18),
                    selected: filters.deadline == option.value,
                    onSelected: (_) => onChanged(
                      filters.copyWith(
                        deadline: filters.deadline == option.value
                            ? 'all'
                            : option.value,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton.icon(
                onPressed: onAdvancedToggle,
                icon: Icon(showAdvanced ? Icons.expand_less : Icons.tune),
                label: Text(showAdvanced ? '상세 필터 닫기' : '상세 필터 열기'),
              ),
            ),
            if (showAdvanced) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final option in typeOptions)
                    FilterChip(
                      label: Text(option.label),
                      selected: filters.types.contains(option.value),
                      onSelected: (_) =>
                          onChanged(filters.toggleType(option.value)),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: filters.sort,
                      decoration: const InputDecoration(labelText: '정렬'),
                      items: sortOptions
                          .map(
                            (option) => DropdownMenuItem(
                              value: option.value,
                              child: Text(option.label),
                            ),
                          )
                          .toList(),
                      onChanged: (value) => onChanged(
                        filters.copyWith(sort: value ?? 'deadline'),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: filters.deadline,
                      decoration: const InputDecoration(labelText: '마감'),
                      items: deadlineOptions
                          .map(
                            (option) => DropdownMenuItem(
                              value: option.value,
                              child: Text(option.label),
                            ),
                          )
                          .toList(),
                      onChanged: (value) =>
                          onChanged(filters.copyWith(deadline: value ?? 'all')),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: regionController,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => onSubmit(),
                decoration: const InputDecoration(
                  labelText: '지역',
                  hintText: '예: 서울, 강남, 수원',
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
              ),
              if (sources.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text('출처', style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final source in sources)
                      FilterChip(
                        label: Text(source.name),
                        selected: filters.sources.contains(source.slug),
                        onSelected: (_) =>
                            onChanged(filters.toggleSource(source.slug)),
                      ),
                  ],
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

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
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        children: [
          AppHero(
            eyebrow: '체험단 지도',
            title: '방문형 캠페인을 지역 기준으로 살펴보세요.',
            body: '모바일에서는 카카오맵/네이버 지도 검색으로 이어지는 경량 지도 흐름을 제공합니다.',
          ),
          const SizedBox(height: 16),
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

class BoardScreen extends StatelessWidget {
  const BoardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: const [
        AppHero(
          eyebrow: '게시판',
          title: '편하게 의견을 남겨주세요.',
          body:
              '요구사항, 문의, 사용 후기를 편하게 남기는 흐름은 유지하되, 쓰기 기능은 서버 API 또는 Supabase Edge Function 이관 후 연결해야 합니다.',
        ),
        SizedBox(height: 16),
        BoardNoticeCard(
          title: '요청사항',
          body: '필터, 지도, 저장 흐름에서 필요한 개선점을 모아볼 수 있는 공간입니다.',
          icon: Icons.lightbulb_outline,
        ),
        SizedBox(height: 8),
        BoardNoticeCard(
          title: '문의',
          body:
              '현재 Flutter 앱은 공개 캠페인 탐색을 우선 지원합니다. 계정 기반 문의 처리는 후속 서버 이관 대상입니다.',
          icon: Icons.help_outline,
        ),
        SizedBox(height: 8),
        BoardNoticeCard(
          title: '응원 한마디',
          body: '웹 게시판의 DB 구조는 유지되어 있어, 안전한 쓰기 API가 준비되면 같은 화면에 연결할 수 있습니다.',
          icon: Icons.favorite_border,
        ),
      ],
    );
  }
}

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

class SupabaseCampaignRepository {
  SupabaseCampaignRepository({
    required this.supabaseUrl,
    required this.anonKey,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String supabaseUrl;
  final String anonKey;
  final http.Client _client;

  static final _campaignSelect = [
    'id',
    'title',
    'platform_type',
    'campaign_type',
    'category_name',
    'subcategory_name',
    'region_primary_name',
    'region_secondary_name',
    'exact_location',
    'latitude',
    'longitude',
    'benefit_text',
    'recruit_count',
    'apply_deadline',
    'thumbnail_url',
    'snippet',
    'status',
    'requires_review',
    'original_url',
    'last_seen_at',
    'sources!inner(name,slug)',
  ].join(',');

  static const _activeSourceSlugs = [
    'reviewnote',
    'reviewplace',
    'revu',
    'dinnerqueen',
    '4blog',
    'seouloppa',
    'ringble',
    'gangnammatzip',
    'chehumview',
    'modan',
    'nolowa',
  ];

  bool get isConfigured => supabaseUrl.isNotEmpty && anonKey.isNotEmpty;

  Future<List<Campaign>> fetchCampaigns(FilterState filters) async {
    final params = _campaignParams(filters);
    final rows = await _getJsonList('campaigns', params);
    return rows.map(Campaign.fromJson).toList();
  }

  Future<List<Campaign>> fetchMapCampaigns() async {
    final params = _campaignParams(
      const FilterState(types: {'visit'}, limit: 80, sort: 'deadline'),
    );
    params['latitude'] = 'not.is.null';
    params['longitude'] = 'not.is.null';
    final rows = await _getJsonList('campaigns', params);
    return rows
        .map(Campaign.fromJson)
        .where((item) => item.hasMapHint)
        .toList();
  }

  Future<List<Campaign>> fetchCampaignsByIds(List<String> ids) async {
    if (ids.isEmpty) return [];
    final params = {
      'select': _campaignSelect,
      'status': 'eq.active',
      'id': 'in.(${ids.join(',')})',
      'order': 'apply_deadline.asc.nullslast,last_seen_at.desc',
      'limit': '${ids.length.clamp(1, 50)}',
    };
    final rows = await _getJsonList('campaigns', params);
    final byId = {
      for (final item in rows.map(Campaign.fromJson)) item.id: item,
    };
    return ids.map((id) => byId[id]).whereType<Campaign>().toList();
  }

  Future<List<Campaign>> fetchRelatedCampaigns(Campaign campaign) async {
    final params = {
      'select': _campaignSelect,
      'status': 'eq.active',
      'limit': '5',
      'order': 'apply_deadline.asc.nullslast,last_seen_at.desc',
    };
    if (campaign.sourceSlug != null) {
      params['sources.slug'] = 'eq.${campaign.sourceSlug}';
    }
    if (campaign.regionPrimary != null) {
      params['region_primary_name'] = 'eq.${campaign.regionPrimary}';
    }
    final rows = await _getJsonList('campaigns', params);
    return rows
        .map(Campaign.fromJson)
        .where((item) => item.id != campaign.id)
        .take(4)
        .toList();
  }

  Future<int> countCampaigns(FilterState filters) async {
    final params = _campaignParams(filters, forCount: true);
    final response = await _send(
      'HEAD',
      'campaigns',
      params,
      extraHeaders: {'Prefer': 'count=exact'},
    );
    final contentRange = response.headers['content-range'];
    return int.tryParse((contentRange ?? '').split('/').last) ?? 0;
  }

  Future<List<SourceInfo>> fetchSources() async {
    final rows = await _getJsonList('sources', {
      'select': 'slug,name,platform_type',
      'is_active': 'eq.true',
      'slug': 'in.(${_activeSourceSlugs.join(',')})',
      'order': 'priority.asc',
    });
    return rows.map(SourceInfo.fromJson).toList();
  }

  Map<String, String> _campaignParams(
    FilterState filters, {
    bool forCount = false,
  }) {
    final params = <String, String>{
      'select': _campaignSelect,
      'status': 'eq.active',
    };
    if (!forCount) {
      params['limit'] = '${filters.limit}';
      params['offset'] = '${filters.offset}';
    }

    final andConditions = <String>[
      'or(apply_deadline.is.null,apply_deadline.gte.${kstToday()})',
    ];
    if (filters.search.isNotEmpty) {
      final escaped = filters.search.replaceAll(',', ' ');
      andConditions.add(
        'or(title.ilike.*$escaped*,benefit_text.ilike.*$escaped*,category_name.ilike.*$escaped*,region_primary_name.ilike.*$escaped*,region_secondary_name.ilike.*$escaped*,snippet.ilike.*$escaped*)',
      );
    }
    if (filters.region.isNotEmpty) {
      final escaped = filters.region.replaceAll(',', ' ');
      andConditions.add(
        'or(region_primary_name.ilike.*$escaped*,region_secondary_name.ilike.*$escaped*)',
      );
    }
    if (andConditions.length == 1) {
      params['or'] = andConditions.first.substring(
        3,
        andConditions.first.length - 1,
      );
    } else {
      params['and'] = '(${andConditions.join(',')})';
    }

    if (filters.platforms.length == 1) {
      params['platform_type'] = 'eq.${filters.platforms.first}';
    } else if (filters.platforms.length > 1) {
      params['platform_type'] = 'in.(${filters.platforms.join(',')})';
    }
    if (filters.types.length == 1) {
      params['campaign_type'] = 'eq.${filters.types.first}';
    } else if (filters.types.length > 1) {
      params['campaign_type'] = 'in.(${filters.types.join(',')})';
    }
    if (filters.sources.length == 1) {
      params['sources.slug'] = 'eq.${filters.sources.first}';
    } else if (filters.sources.length > 1) {
      params['sources.slug'] = 'in.(${filters.sources.join(',')})';
    }
    final deadline = deadlineLimit(filters.deadline);
    if (deadline != null) {
      params['apply_deadline'] = 'lte.$deadline';
    }
    params['order'] = switch (filters.sort) {
      'newest' => 'last_seen_at.desc,apply_deadline.asc.nullslast',
      'slots' => 'recruit_count.desc.nullslast,apply_deadline.asc.nullslast',
      _ => 'apply_deadline.asc.nullslast,last_seen_at.desc',
    };
    return params;
  }

  Future<List<Map<String, dynamic>>> _getJsonList(
    String table,
    Map<String, String> params,
  ) async {
    final response = await _send('GET', table, params);
    final decoded = jsonDecode(response.body);
    if (decoded is! List) return [];
    return decoded
        .whereType<Map>()
        .map((item) => item.cast<String, dynamic>())
        .toList();
  }

  Future<http.Response> _send(
    String method,
    String table,
    Map<String, String> params, {
    Map<String, String> extraHeaders = const {},
  }) async {
    if (!isConfigured) {
      throw StateError(
        'Missing SUPABASE_URL or SUPABASE_ANON_KEY dart-define.',
      );
    }
    final base = Uri.parse(supabaseUrl);
    final uri = base.replace(
      path: '${base.path.replaceFirst(RegExp(r'/$'), '')}/rest/v1/$table',
      queryParameters: params,
    );
    final request = http.Request(method, uri)
      ..headers.addAll({
        'apikey': anonKey,
        'Authorization': 'Bearer $anonKey',
        'Content-Type': 'application/json',
        ...extraHeaders,
      });
    final streamed = await _client
        .send(request)
        .timeout(const Duration(seconds: 18));
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StateError(
        'Supabase request failed: ${response.statusCode} ${response.body}',
      );
    }
    return response;
  }
}

class SavedCampaignStore {
  static const _key = 'reviewkok.savedCampaignIds';

  Future<Set<String>> readSavedIds() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_key) ?? const <String>[]).toSet();
  }

  Future<Set<String>> toggle(String id) async {
    final ids = await readSavedIds();
    if (ids.contains(id)) {
      ids.remove(id);
    } else {
      ids.add(id);
    }
    await _write(ids);
    return ids;
  }

  Future<void> remove(String id) async {
    final ids = await readSavedIds();
    ids.remove(id);
    await _write(ids);
  }

  Future<void> _write(Set<String> ids) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_key, ids.toList());
  }
}

class Campaign {
  const Campaign({
    required this.id,
    required this.title,
    required this.platformType,
    required this.campaignType,
    required this.regionPrimary,
    required this.regionSecondary,
    required this.benefitText,
    required this.recruitCount,
    required this.applyDeadline,
    required this.thumbnailUrl,
    required this.snippet,
    required this.requiresReview,
    required this.originalUrl,
    required this.sourceName,
    required this.sourceSlug,
    required this.exactLocation,
    required this.latitude,
    required this.longitude,
  });

  factory Campaign.fromJson(Map<String, dynamic> json) {
    final source = json['sources'];
    return Campaign(
      id: '${json['id']}',
      title: cleanText(json['title']),
      platformType: '${json['platform_type'] ?? 'etc'}',
      campaignType: '${json['campaign_type'] ?? 'etc'}',
      regionPrimary: nullableText(json['region_primary_name']),
      regionSecondary: nullableText(json['region_secondary_name']),
      benefitText: nullableText(json['benefit_text']),
      recruitCount: json['recruit_count'] is num
          ? (json['recruit_count'] as num).toInt()
          : int.tryParse('${json['recruit_count'] ?? ''}'),
      applyDeadline: nullableText(json['apply_deadline']),
      thumbnailUrl: normalizeImageUrl(nullableText(json['thumbnail_url'])),
      snippet: nullableText(json['snippet']),
      requiresReview: json['requires_review'] == true,
      originalUrl: nullableText(json['original_url']),
      sourceName: source is Map ? cleanText(source['name']) : '출처 미상',
      sourceSlug: source is Map ? nullableText(source['slug']) : null,
      exactLocation: nullableText(json['exact_location']),
      latitude: json['latitude'] is num
          ? (json['latitude'] as num).toDouble()
          : double.tryParse('${json['latitude'] ?? ''}'),
      longitude: json['longitude'] is num
          ? (json['longitude'] as num).toDouble()
          : double.tryParse('${json['longitude'] ?? ''}'),
    );
  }

  final String id;
  final String title;
  final String platformType;
  final String campaignType;
  final String? regionPrimary;
  final String? regionSecondary;
  final String? benefitText;
  final int? recruitCount;
  final String? applyDeadline;
  final String? thumbnailUrl;
  final String? snippet;
  final bool requiresReview;
  final String? originalUrl;
  final String sourceName;
  final String? sourceSlug;
  final String? exactLocation;
  final double? latitude;
  final double? longitude;

  String get cleanTitle => title.isEmpty ? '제목 미상' : title;
  String get summary {
    final cleanSnippet = cleanText(snippet);
    if (cleanSnippet.isEmpty ||
        cleanSnippet == cleanTitle ||
        cleanSnippet.replaceAll(' ', '') == cleanTitle.replaceAll(' ', '')) {
      return '혜택·마감·지역부터 확인해보세요.';
    }
    return cleanSnippet;
  }

  String get platformLabel => platformLabels[platformType] ?? '기타';
  String get typeLabel => typeLabels[campaignType] ?? '기타';
  String get regionLabel {
    if (regionPrimary != null && regionSecondary != null) {
      return '$regionPrimary · $regionSecondary';
    }
    if (regionPrimary != null) {
      return regionPrimary!;
    }
    return '지역 미상';
  }

  String get recruitLabel => recruitCount == null ? '인원 미공개' : '$recruitCount명';
  String get deadlineLabel => formatDeadline(applyDeadline);
  DeadlineState get deadlineState => getDeadlineState(applyDeadline);
  String get confidenceLabel {
    if (requiresReview) return '원문 참고';
    if (applyDeadline == null || benefitText == null) return '정보 일부 확인';
    return '핵심 정보 충분';
  }

  IconData get platformIcon => switch (platformType) {
    'blog' => Icons.edit_outlined,
    'instagram' => Icons.camera_alt_outlined,
    'youtube' => Icons.play_circle_outline,
    'mixed' => Icons.grid_view_outlined,
    _ => Icons.category_outlined,
  };
  IconData get typeIcon => switch (campaignType) {
    'visit' => Icons.storefront_outlined,
    'delivery' => Icons.local_shipping_outlined,
    'purchase' => Icons.sell_outlined,
    'content' => Icons.rate_review_outlined,
    _ => Icons.label_outline,
  };
  bool get hasMapHint =>
      campaignType == 'visit' &&
      (exactLocation != null ||
          latitude != null ||
          regionPrimary != null ||
          regionSecondary != null);
}

class SourceInfo {
  const SourceInfo({required this.slug, required this.name});

  factory SourceInfo.fromJson(Map<String, dynamic> json) {
    return SourceInfo(slug: '${json['slug']}', name: cleanText(json['name']));
  }

  final String slug;
  final String name;
}

class FilterState {
  const FilterState({
    this.search = '',
    this.region = '',
    this.platforms = const {},
    this.types = const {},
    this.sources = const {},
    this.deadline = 'all',
    this.sort = 'deadline',
    this.limit = 24,
    this.offset = 0,
  });

  final String search;
  final String region;
  final Set<String> platforms;
  final Set<String> types;
  final Set<String> sources;
  final String deadline;
  final String sort;
  final int limit;
  final int offset;

  FilterState copyWith({
    String? search,
    String? region,
    Set<String>? platforms,
    Set<String>? types,
    Set<String>? sources,
    String? deadline,
    String? sort,
    int? limit,
    int? offset,
  }) {
    return FilterState(
      search: search ?? this.search,
      region: region ?? this.region,
      platforms: platforms ?? this.platforms,
      types: types ?? this.types,
      sources: sources ?? this.sources,
      deadline: deadline ?? this.deadline,
      sort: sort ?? this.sort,
      limit: limit ?? this.limit,
      offset: offset ?? this.offset,
    );
  }

  FilterState togglePlatform(String value) =>
      copyWith(platforms: toggled(platforms, value));
  FilterState toggleType(String value) =>
      copyWith(types: toggled(types, value));
  FilterState toggleSource(String value) =>
      copyWith(sources: toggled(sources, value));
}

class FilterOption {
  const FilterOption(this.value, this.label, [this.icon = Icons.label_outline]);

  final String value;
  final String label;
  final IconData icon;
}

const platformOptions = [
  FilterOption('blog', '블로그', Icons.edit_outlined),
  FilterOption('instagram', '인스타', Icons.camera_alt_outlined),
  FilterOption('youtube', '유튜브', Icons.play_circle_outline),
  FilterOption('mixed', '멀티', Icons.grid_view_outlined),
];
const typeOptions = [
  FilterOption('visit', '방문형'),
  FilterOption('delivery', '배송형'),
  FilterOption('purchase', '구매형'),
  FilterOption('content', '콘텐츠형'),
];
const deadlineOptions = [
  FilterOption('all', '전체 마감'),
  FilterOption('today', '오늘까지'),
  FilterOption('3days', '3일 안'),
  FilterOption('7days', '7일 안'),
];
const sortOptions = [
  FilterOption('deadline', '마감순'),
  FilterOption('newest', '최근 업데이트'),
  FilterOption('slots', '모집 많은 순'),
];
const platformLabels = {
  'blog': '블로그',
  'instagram': '인스타',
  'youtube': '유튜브',
  'tiktok': '틱톡',
  'mixed': '멀티',
  'etc': '기타',
};
const typeLabels = {
  'visit': '방문형',
  'delivery': '배송형',
  'purchase': '구매형',
  'content': '콘텐츠형',
  'mixed': '혼합형',
  'etc': '기타',
};

class DeadlineState {
  const DeadlineState(this.label, this.tone);

  final String label;
  final PillTone tone;
}

Set<String> toggled(Set<String> values, String value) {
  final next = {...values};
  if (next.contains(value)) {
    next.remove(value);
  } else {
    next.add(value);
  }
  return next;
}

String cleanText(Object? value) {
  return '${value ?? ''}'
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&nbsp;', ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}

String? nullableText(Object? value) {
  final text = cleanText(value);
  return text.isEmpty || text == 'null' ? null : text;
}

String? normalizeImageUrl(String? value) {
  if (value == null) return null;
  if (value.contains('dq-files.gcdn.ntruss.com')) return null;
  return value;
}

String formatDeadline(String? value) {
  if (value == null) return '마감일 미상';
  final date = DateTime.tryParse(value);
  if (date == null) return '마감일 미상';
  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
  return '${date.month}월 ${date.day}일 (${weekdays[date.weekday - 1]})';
}

DeadlineState getDeadlineState(String? value) {
  if (value == null) return const DeadlineState('일정 확인 필요', PillTone.muted);
  final date = DateTime.tryParse(value);
  if (date == null) return const DeadlineState('일정 확인 필요', PillTone.muted);
  final diffDays = date.difference(DateTime.now()).inHours / 24;
  if (diffDays < 0) return const DeadlineState('마감 지남', PillTone.muted);
  if (diffDays <= 1) return const DeadlineState('오늘·내일 마감', PillTone.danger);
  if (diffDays <= 3) return const DeadlineState('3일 이내 마감', PillTone.warning);
  if (diffDays <= 7) return const DeadlineState('이번 주 마감', PillTone.accent);
  return const DeadlineState('여유 있음', PillTone.ok);
}

String kstToday() {
  final now = DateTime.now().toUtc().add(const Duration(hours: 9));
  String two(int value) => value.toString().padLeft(2, '0');
  return '${now.year}-${two(now.month)}-${two(now.day)}';
}

String? deadlineLimit(String value) {
  final now = DateTime.now();
  final date = switch (value) {
    'today' => now,
    '3days' => now.add(const Duration(days: 3)),
    '7days' => now.add(const Duration(days: 7)),
    _ => null,
  };
  return date?.toUtc().toIso8601String();
}

String formatCount(int value) {
  final text = value.toString();
  final buffer = StringBuffer();
  for (var i = 0; i < text.length; i++) {
    if (i > 0 && (text.length - i) % 3 == 0) buffer.write(',');
    buffer.write(text[i]);
  }
  return buffer.toString();
}

Future<void> openExternal(String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<void> openMapSearch(Campaign campaign) async {
  final query = [
    campaign.regionPrimary,
    campaign.regionSecondary,
    campaign.exactLocation,
    campaign.cleanTitle,
  ].whereType<String>().where((part) => part.trim().isNotEmpty).join(' ');
  if (query.isEmpty) return;
  final uri = Uri.parse(
    'https://map.kakao.com/link/search/${Uri.encodeComponent(query)}',
  );
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}
