import 'package:shared_preferences/shared_preferences.dart';
import 'package:nusa/shared/models/user_model.dart';

class SwitchAccountService {
  static const String _currentRoleKey = 'current_role';
  static const String _originalRoleKey = 'original_role';

  /// Switch to participant mode (temporary)
  static Future<void> switchToParticipant() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_currentRoleKey, 'PARTICIPANT');
    print('🔄 SwitchAccountService: Switched to PARTICIPANT mode');
  }

  /// Switch to organizer mode (temporary)
  static Future<void> switchToOrganizer() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_currentRoleKey, 'ORGANIZER');
    print('🔄 SwitchAccountService: Switched to ORGANIZER mode');
  }

  /// Get current active role (temporary role or original role)
  static Future<String> getCurrentRole() async {
    final prefs = await SharedPreferences.getInstance();
    final currentRole = prefs.getString(_currentRoleKey);
    return currentRole ?? 'PARTICIPANT'; // Default to participant
  }

  /// Get original role from user data
  static String getOriginalRole(UserModel user) {
    return user.role;
  }

  /// Check if user is currently in participant mode
  static Future<bool> isInParticipantMode() async {
    final currentRole = await getCurrentRole();
    return currentRole == 'PARTICIPANT';
  }

  /// Check if user is currently in organizer mode
  static Future<bool> isInOrganizerMode() async {
    final currentRole = await getCurrentRole();
    return currentRole == 'ORGANIZER';
  }

  /// Check if user can switch roles (must be organizer)
  static bool canSwitchRoles(UserModel user) {
    return user.role == 'ORGANIZER' && user.verificationStatus == 'APPROVED';
  }

  /// Reset to original role
  static Future<void> resetToOriginalRole(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_currentRoleKey, user.role);
    print('🔄 SwitchAccountService: Reset to original role: ${user.role}');
  }

  /// Clear switch account data (on logout)
  static Future<void> clearSwitchData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_currentRoleKey);
    await prefs.remove(_originalRoleKey);
    print('🔄 SwitchAccountService: Cleared switch account data');
  }

  /// Get role display name for current mode
  static Future<String> getCurrentRoleDisplayName(UserModel user) async {
    final currentRole = await getCurrentRole();
    final originalRole = getOriginalRole(user);
    
    if (currentRole == 'PARTICIPANT' && originalRole == 'ORGANIZER') {
      return 'Participant Mode';
    } else if (currentRole == 'ORGANIZER' && originalRole == 'ORGANIZER') {
      return 'Event Organizer';
    } else {
      return 'Participant';
    }
  }

  /// Get role description for current mode
  static Future<String> getCurrentRoleDescription(UserModel user) async {
    final currentRole = await getCurrentRole();
    final originalRole = getOriginalRole(user);
    
    if (currentRole == 'PARTICIPANT' && originalRole == 'ORGANIZER') {
      return 'You are viewing as a participant. Switch back to organizer mode anytime.';
    } else if (currentRole == 'ORGANIZER' && originalRole == 'ORGANIZER') {
      return 'You are in organizer mode. Switch to participant mode to browse events.';
    } else {
      return 'You are a participant.';
    }
  }
}
