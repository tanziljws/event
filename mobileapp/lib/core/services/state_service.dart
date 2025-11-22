import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class StateService {
  static const String _statePrefix = 'state_';

  /// Save state data
  static Future<void> saveState(String key, dynamic data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('$_statePrefix$key', jsonEncode(data));
      print('💾 STATE: Saved state for key: $key');
    } catch (e) {
      print('❌ STATE ERROR: Failed to save state for key $key: $e');
    }
  }

  /// Load state data
  static Future<dynamic> loadState(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final stateString = prefs.getString('$_statePrefix$key');
      
      if (stateString == null) {
        print('💾 STATE: No state found for key: $key');
        return null;
      }

      final stateData = jsonDecode(stateString);
      print('💾 STATE: Loaded state for key: $key');
      return stateData;
    } catch (e) {
      print('❌ STATE ERROR: Failed to load state for key $key: $e');
      return null;
    }
  }

  /// Remove state data
  static Future<void> removeState(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_statePrefix$key');
      print('💾 STATE: Removed state for key: $key');
    } catch (e) {
      print('❌ STATE ERROR: Failed to remove state for key $key: $e');
    }
  }

  /// Clear all state data
  static Future<void> clearAllState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      for (final key in keys) {
        if (key.startsWith(_statePrefix)) {
          await prefs.remove(key);
        }
      }
      
      print('💾 STATE: Cleared all state');
    } catch (e) {
      print('❌ STATE ERROR: Failed to clear state: $e');
    }
  }

  /// Check if state exists
  static Future<bool> hasState(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.containsKey('$_statePrefix$key');
    } catch (e) {
      print('❌ STATE ERROR: Failed to check state existence for key $key: $e');
      return false;
    }
  }
}
