part of '../../main.dart';

class ReviewersApp extends StatelessWidget {
  const ReviewersApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '리뷰콕',
      debugShowCheckedModeBanner: false,
      theme: reviewKokTheme(),
      onGenerateRoute: (settings) {
        return MaterialPageRoute<void>(
          settings: settings,
          builder: (_) =>
              ReviewersHome(initialSection: appSectionFromRoute(settings.name)),
        );
      },
    );
  }
}

ThemeData reviewKokTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: RkColor.primary,
    brightness: Brightness.light,
    surface: RkColor.surface,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme.copyWith(
      primary: RkColor.primary,
      onPrimary: RkColor.white,
      primaryContainer: RkColor.primaryWeak,
      onPrimaryContainer: RkColor.primaryText,
      secondary: RkColor.success,
      surface: RkColor.surface,
      onSurface: RkColor.ink700,
      surfaceContainerLowest: RkColor.paper,
      surfaceContainerLow: RkColor.sunken,
      surfaceContainer: RkColor.paper2,
      outline: RkColor.line,
      outlineVariant: RkColor.lineStrong,
      error: RkColor.danger,
      onErrorContainer: RkColor.dangerText,
    ),
    scaffoldBackgroundColor: RkColor.paper,
    splashFactory: InkRipple.splashFactory,
    visualDensity: VisualDensity.standard,
    fontFamilyFallback: const [
      'Pretendard',
      'Pretendard Variable',
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
        color: RkColor.ink900,
      ),
      headlineMedium: TextStyle(
        fontSize: 22,
        height: 1.3,
        fontWeight: FontWeight.w800,
        color: RkColor.ink900,
      ),
      titleLarge: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w800,
        color: RkColor.ink900,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: RkColor.ink900,
      ),
      bodyLarge: TextStyle(fontSize: 15, height: 1.55, color: RkColor.ink700),
      bodyMedium: TextStyle(fontSize: 14, height: 1.5, color: RkColor.ink700),
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: RkColor.ink700,
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: RkColor.paper,
      foregroundColor: RkColor.ink900,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: RkColor.surface,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(RkRadius.lg),
        side: const BorderSide(color: RkColor.line),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: RkColor.surface,
      labelStyle: const TextStyle(
        color: RkColor.ink500,
        fontWeight: FontWeight.w700,
      ),
      hintStyle: const TextStyle(color: RkColor.ink400),
      prefixIconColor: RkColor.ink400,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(RkRadius.lg),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(RkRadius.lg),
        borderSide: const BorderSide(color: RkColor.lineStrong),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(RkRadius.lg),
        borderSide: const BorderSide(color: RkColor.primary, width: 1.4),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: RkSpace.x4,
        vertical: 14,
      ),
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(RkRadius.pill),
        side: const BorderSide(color: RkColor.lineStrong),
      ),
      backgroundColor: RkColor.surface,
      selectedColor: RkColor.primaryWeak,
      checkmarkColor: RkColor.primaryText,
      iconTheme: const IconThemeData(color: RkColor.ink500, size: 18),
      labelStyle: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: RkColor.ink700,
      ),
      secondaryLabelStyle: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w800,
        color: RkColor.primaryText,
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: RkSpace.x2,
        vertical: RkSpace.x2,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(44, 44),
        backgroundColor: RkColor.primary,
        foregroundColor: RkColor.white,
        disabledBackgroundColor: RkColor.ink300,
        disabledForegroundColor: RkColor.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(RkRadius.lg),
        ),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(44, 44),
        foregroundColor: RkColor.ink700,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(RkRadius.lg),
        ),
        side: const BorderSide(color: RkColor.lineStrong),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: RkColor.primaryText,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(RkRadius.lg),
        ),
        textStyle: const TextStyle(fontWeight: FontWeight.w800),
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(
        foregroundColor: RkColor.ink500,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(RkRadius.lg),
        ),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 64,
      backgroundColor: RkColor.surface,
      surfaceTintColor: Colors.transparent,
      indicatorColor: RkColor.primaryWeak,
      shadowColor: Colors.transparent,
      elevation: 0,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 11,
          fontWeight: selected ? FontWeight.w800 : FontWeight.w700,
          color: selected ? RkColor.primaryText : RkColor.ink500,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(
          color: selected ? RkColor.primaryText : RkColor.ink500,
          size: 22,
        );
      }),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        backgroundColor: WidgetStateProperty.resolveWith((states) {
          return states.contains(WidgetState.selected)
              ? RkColor.surface
              : RkColor.sunken;
        }),
        foregroundColor: WidgetStateProperty.resolveWith((states) {
          return states.contains(WidgetState.selected)
              ? RkColor.ink900
              : RkColor.ink500;
        }),
        side: WidgetStateProperty.resolveWith((states) {
          return BorderSide(
            color: states.contains(WidgetState.selected)
                ? RkColor.lineStrong
                : RkColor.line,
          );
        }),
        shape: WidgetStatePropertyAll(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(RkRadius.pill),
          ),
        ),
        textStyle: const WidgetStatePropertyAll(
          TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
        ),
      ),
    ),
  );
}
