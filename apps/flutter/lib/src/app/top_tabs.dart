part of '../../main.dart';

class TopTabs extends StatelessWidget {
  const TopTabs({required this.section, required this.onSelect, super.key});

  final AppSection section;
  final ValueChanged<AppSection> onSelect;

  @override
  Widget build(BuildContext context) {
    final selected = section == AppSection.saved ? AppSection.explore : section;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Container(
        padding: const EdgeInsets.all(3),
        decoration: BoxDecoration(
          color: RkColor.sunken,
          border: Border.all(color: RkColor.line),
          borderRadius: BorderRadius.circular(RkRadius.pill),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final item in topLevelSections)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 1),
                child: InkWell(
                  borderRadius: BorderRadius.circular(RkRadius.pill),
                  onTap: () => onSelect(item),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    curve: Curves.easeOut,
                    constraints: const BoxConstraints(minHeight: 32),
                    padding: const EdgeInsets.symmetric(
                      horizontal: RkSpace.x4,
                      vertical: RkSpace.x2,
                    ),
                    decoration: BoxDecoration(
                      color: selected == item
                          ? RkColor.surface
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(RkRadius.pill),
                      boxShadow: selected == item
                          ? const [
                              BoxShadow(
                                color: Color(0x0F1B1A17),
                                blurRadius: 2,
                                offset: Offset(0, 1),
                              ),
                            ]
                          : null,
                    ),
                    child: Text(
                      item.topLabel,
                      style: TextStyle(
                        color: selected == item
                            ? RkColor.ink900
                            : RkColor.ink500,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
