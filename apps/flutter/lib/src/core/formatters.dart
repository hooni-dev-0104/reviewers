part of '../../main.dart';

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

String formatBoardDate(String? value) {
  if (value == null) return '작성일 미상';
  final date = DateTime.tryParse(value);
  if (date == null) return '작성일 미상';
  String two(int value) => value.toString().padLeft(2, '0');
  return '${date.year}.${two(date.month)}.${two(date.day)} ${two(date.hour)}:${two(date.minute)}';
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
