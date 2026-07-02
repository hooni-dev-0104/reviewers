part of '../../main.dart';

class SavedCampaignStore {
  static const _key = 'reviewkok.savedCampaignIds';

  Future<Set<String>> readSavedIds() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_key) ?? const <String>[]).toSet();
  }

  Future<Set<String>> toggle(String id) async {
    final ids = await readSavedIds();
    if (ids.contains(id)) {
      ids.remove(id);
    } else {
      ids.add(id);
    }
    await _write(ids);
    return ids;
  }

  Future<void> remove(String id) async {
    final ids = await readSavedIds();
    ids.remove(id);
    await _write(ids);
  }

  Future<void> _write(Set<String> ids) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_key, ids.toList());
  }
}
