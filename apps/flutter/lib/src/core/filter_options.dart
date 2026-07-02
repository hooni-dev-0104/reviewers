part of '../../main.dart';

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
