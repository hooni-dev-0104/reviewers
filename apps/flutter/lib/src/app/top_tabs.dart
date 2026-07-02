part of '../../main.dart';

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
        segments: [
          for (final section in topLevelSections)
            ButtonSegment(value: section, label: Text(section.topLabel)),
        ],
        onSelectionChanged: (value) => onSelect(value.first),
      ),
    );
  }
}
