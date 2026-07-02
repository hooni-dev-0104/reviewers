part of '../../main.dart';

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
