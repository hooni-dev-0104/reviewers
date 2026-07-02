part of '../../main.dart';

class SupabaseBoardRepository {
  SupabaseBoardRepository({
    required this.supabaseUrl,
    required this.anonKey,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String supabaseUrl;
  final String anonKey;
  final http.Client _client;

  bool get isConfigured => supabaseUrl.isNotEmpty && anonKey.isNotEmpty;

  Future<List<BoardPost>> fetchPosts({
    BoardVisibility visibility = BoardVisibility.all,
    int limit = 50,
  }) async {
    final params = <String, String>{
      'select':
          'id,visibility,nickname,title,body,created_at,updated_at,is_deleted',
      'is_deleted': 'eq.false',
      'order': 'created_at.desc',
      'limit': '${limit.clamp(1, 100)}',
    };
    if (visibility != BoardVisibility.all) {
      params['visibility'] = 'eq.${visibility.value}';
    }

    final response = await _send('GET', 'board_posts', params);
    final decoded = jsonDecode(response.body);
    if (decoded is! List) return const [];
    return decoded
        .whereType<Map>()
        .map((item) => BoardPost.fromJson(item.cast<String, dynamic>()))
        .toList();
  }

  Future<http.Response> _send(
    String method,
    String table,
    Map<String, String> params,
  ) async {
    if (!isConfigured) {
      throw StateError(
        'Missing SUPABASE_URL or SUPABASE_ANON_KEY dart-define.',
      );
    }
    final base = Uri.parse(supabaseUrl);
    final uri = base.replace(
      path: '${base.path.replaceFirst(RegExp(r'/$'), '')}/rest/v1/$table',
      queryParameters: params,
    );
    final request = http.Request(method, uri)
      ..headers.addAll({
        'apikey': anonKey,
        'Authorization': 'Bearer $anonKey',
        'Content-Type': 'application/json',
      });
    final streamed = await _client
        .send(request)
        .timeout(const Duration(seconds: 18));
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StateError(
        'Supabase board request failed: ${response.statusCode} ${response.body}',
      );
    }
    return response;
  }
}
