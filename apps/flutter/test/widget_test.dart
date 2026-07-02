import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewers_flutter/main.dart';

void main() {
  testWidgets('renders ReviewKok shell', (tester) async {
    await tester.pumpWidget(const ReviewersApp());

    expect(find.text('리뷰콕'), findsOneWidget);
    expect(find.text('목록'), findsOneWidget);
    expect(find.text('체험단 지도'), findsOneWidget);
    expect(find.text('게시판'), findsAtLeastNWidgets(1));
  });

  testWidgets('opens map section from app route metadata', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: ReviewersHome(initialSection: AppSection.map)),
    );

    expect(find.text('방문형 캠페인을 지역 기준으로 살펴보세요.'), findsOneWidget);
  });

  testWidgets('opens board section with visibility filters', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: ReviewersHome(initialSection: AppSection.board)),
    );

    expect(find.text('전체'), findsOneWidget);
    expect(find.text('공개'), findsOneWidget);
    expect(find.text('비공개'), findsOneWidget);
  });
}
