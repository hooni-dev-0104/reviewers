part of '../../../main.dart';

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
        padding: const EdgeInsets.all(RkSpace.x4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.tune, size: 20, color: RkColor.primaryText),
                const SizedBox(width: RkSpace.x2),
                Text('필터', style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                Text(
                  '마감·혜택 우선',
                  style: Theme.of(
                    context,
                  ).textTheme.labelLarge?.copyWith(color: RkColor.ink500),
                ),
              ],
            ),
            const SizedBox(height: RkSpace.x3),
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
                const SizedBox(width: RkSpace.x2),
                FilledButton(onPressed: onSubmit, child: const Text('검색')),
              ],
            ),
            const SizedBox(height: RkSpace.x3),
            Wrap(
              spacing: RkSpace.x2,
              runSpacing: RkSpace.x2,
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
            const SizedBox(height: RkSpace.x2),
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton.icon(
                onPressed: onAdvancedToggle,
                icon: Icon(showAdvanced ? Icons.expand_less : Icons.tune),
                label: Text(showAdvanced ? '상세 필터 닫기' : '상세 필터 열기'),
              ),
            ),
            if (showAdvanced) ...[
              const SizedBox(height: RkSpace.x3),
              const Divider(height: 1, color: RkColor.line),
              const SizedBox(height: RkSpace.x3),
              Wrap(
                spacing: RkSpace.x2,
                runSpacing: RkSpace.x2,
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
              const SizedBox(height: RkSpace.x3),
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
                  const SizedBox(width: RkSpace.x2),
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
              const SizedBox(height: RkSpace.x3),
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
                const SizedBox(height: RkSpace.x3),
                Text('출처', style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: RkSpace.x2),
                Wrap(
                  spacing: RkSpace.x2,
                  runSpacing: RkSpace.x2,
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
