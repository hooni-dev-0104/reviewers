import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

part 'src/app/app_shell.dart';
part 'src/app/reviewers_app.dart';
part 'src/app/top_tabs.dart';
part 'src/core/filter_options.dart';
part 'src/core/formatters.dart';
part 'src/data/supabase_board_repository.dart';
part 'src/data/saved_campaign_store.dart';
part 'src/data/supabase_campaign_repository.dart';
part 'src/domain/board_post.dart';
part 'src/domain/campaign.dart';
part 'src/domain/filter_models.dart';
part 'src/features/board/board_screen.dart';
part 'src/features/campaign/campaign_card.dart';
part 'src/features/campaign/campaign_detail_screen.dart';
part 'src/features/explore/explore_screen.dart';
part 'src/features/explore/filter_panel.dart';
part 'src/features/map/map_screen.dart';
part 'src/features/saved/saved_screen.dart';
part 'src/shared/widgets/common_widgets.dart';

const _supabaseUrl = String.fromEnvironment(
  'SUPABASE_URL',
  defaultValue: String.fromEnvironment('NEXT_PUBLIC_SUPABASE_URL'),
);
const _supabaseAnonKey = String.fromEnvironment(
  'SUPABASE_ANON_KEY',
  defaultValue: String.fromEnvironment('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
);

void main() {
  runApp(const ReviewersApp());
}
