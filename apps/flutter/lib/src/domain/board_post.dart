part of '../../main.dart';

enum BoardVisibility {
  all('all', '전체'),
  public('public', '공개'),
  private('private', '비공개');

  const BoardVisibility(this.value, this.label);

  final String value;
  final String label;
}

class BoardPost {
  const BoardPost({
    required this.id,
    required this.visibility,
    required this.nickname,
    required this.title,
    required this.body,
    required this.createdAt,
  });

  factory BoardPost.fromJson(Map<String, dynamic> json) {
    final visibility = '${json['visibility'] ?? 'public'}';
    return BoardPost(
      id: '${json['id']}',
      visibility: visibility == 'private'
          ? BoardVisibility.private
          : BoardVisibility.public,
      nickname: cleanText(json['nickname']).isEmpty
          ? '익명'
          : cleanText(json['nickname']),
      title: cleanText(json['title']).isEmpty
          ? '제목 없음'
          : cleanText(json['title']),
      body: nullableText(json['body']),
      createdAt: nullableText(json['created_at']),
    );
  }

  final String id;
  final BoardVisibility visibility;
  final String nickname;
  final String title;
  final String? body;
  final String? createdAt;

  bool get isPrivate => visibility == BoardVisibility.private;
  String get preview =>
      isPrivate ? '비공개 글입니다. 제목은 공개되고 본문은 잠겨 있어요.' : body ?? '본문 미리보기가 없어요.';
}
