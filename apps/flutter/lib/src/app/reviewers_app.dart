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
