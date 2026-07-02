part of '../../../main.dart';

class BoardScreen extends StatefulWidget {
  const BoardScreen({required this.repository, super.key});

  final SupabaseBoardRepository repository;

  @override
  State<BoardScreen> createState() => _BoardScreenState();
}

class _BoardScreenState extends State<BoardScreen> {
  BoardVisibility _visibility = BoardVisibility.all;
  late Future<List<BoardPost>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<BoardPost>> _load() {
    return widget.repository.fetchPosts(visibility: _visibility);
  }

  void _reload() {
    setState(() => _future = _load());
  }

  void _setVisibility(BoardVisibility visibility) {
    if (_visibility == visibility) return;
    setState(() {
      _visibility = visibility;
      _future = _load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => _reload(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        children: [
          const AppHero(
            eyebrow: '게시판',
            title: '편하게 의견을 남겨주세요.',
            body:
                '요구사항, 문의, 사용 후기를 보는 흐름을 Flutter로 옮겼습니다. 글 작성과 비공개 글 열람은 안전한 서버 API 이관 후 연결합니다.',
          ),
          const SizedBox(height: 16),
          BoardWriteStatusCard(repository: widget.repository),
          const SizedBox(height: 12),
          BoardVisibilityTabs(selected: _visibility, onChanged: _setVisibility),
          const SizedBox(height: 12),
          FutureBuilder<List<BoardPost>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const CampaignSkeletonList(itemCount: 3);
              }
              if (snapshot.hasError) {
                return ErrorPanel(
                  message: widget.repository.isConfigured
                      ? '게시글을 불러오지 못했습니다.'
                      : 'Supabase 환경값이 필요합니다. --dart-define으로 SUPABASE_URL과 SUPABASE_ANON_KEY를 전달하세요.',
                  detail: '${snapshot.error}',
                  onRetry: _reload,
                );
              }
              final posts = snapshot.data ?? const <BoardPost>[];
              if (posts.isEmpty) {
                return const EmptyPanel(
                  icon: Icons.edit_note_outlined,
                  title: '아직 게시글이 없어요',
                  body: '첫 번째 문의나 의견이 올라오면 이곳에 표시됩니다.',
                );
              }
              return Column(
                children: [
                  for (final post in posts) ...[
                    BoardPostTile(post: post),
                    const SizedBox(height: 10),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class BoardVisibilityTabs extends StatelessWidget {
  const BoardVisibilityTabs({
    required this.selected,
    required this.onChanged,
    super.key,
  });

  final BoardVisibility selected;
  final ValueChanged<BoardVisibility> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SegmentedButton<BoardVisibility>(
        showSelectedIcon: false,
        selected: {selected},
        segments: [
          for (final visibility in BoardVisibility.values)
            ButtonSegment(value: visibility, label: Text(visibility.label)),
        ],
        onSelectionChanged: (value) => onChanged(value.first),
      ),
    );
  }
}

class BoardPostTile extends StatelessWidget {
  const BoardPostTile({required this.post, super.key});

  final BoardPost post;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                StatusPill(
                  label: post.visibility.label,
                  tone: post.isPrivate ? PillTone.warning : PillTone.ok,
                  icon: post.isPrivate
                      ? Icons.lock_outline
                      : Icons.public_outlined,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    post.nickname,
                    style: const TextStyle(
                      color: Color(0xFF6B665D),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                Text(
                  formatBoardDate(post.createdAt),
                  style: const TextStyle(
                    color: Color(0xFF6B665D),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(post.title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              post.preview,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: post.isPrivate
                    ? const Color(0xFF8A5410)
                    : const Color(0xFF36332D),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BoardWriteStatusCard extends StatelessWidget {
  const BoardWriteStatusCard({required this.repository, super.key});

  final SupabaseBoardRepository repository;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.construction_outlined, color: Color(0xFF2B5FE3)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '쓰기 기능 이관 대기',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    repository.isConfigured
                        ? '공개 목록은 Supabase에서 읽고, 작성/비밀번호 확인은 Edge Function 또는 서버 API로 분리해 연결할 예정입니다.'
                        : '환경값이 없으면 게시글 목록도 읽을 수 없습니다. 실행 시 SUPABASE_URL과 SUPABASE_ANON_KEY를 전달하세요.',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
