part of '../../main.dart';

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
