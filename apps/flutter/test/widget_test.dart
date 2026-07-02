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
}
