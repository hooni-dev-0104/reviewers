part of '../../main.dart';

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
