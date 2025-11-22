import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure storage service for sensitive data like JWT tokens
class SecureStorageService {
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  // JWT Token keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _tokenExpiryKey = 'token_expiry';
  
  // Onboarding keys
  static const String _onboardingCompletedKey = 'onboarding_completed';

  /// Save access token securely
  static Future<void> saveAccessToken(String token) async {
    await _secureStorage.write(key: _accessTokenKey, value: token);
  }

  /// Get access token
  static Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: _accessTokenKey);
  }

  /// Save refresh token securely
  static Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(key: _refreshTokenKey, value: token);
  }

  /// Get refresh token
  static Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: _refreshTokenKey);
  }

  /// Save token expiry
  static Future<void> saveTokenExpiry(DateTime expiry) async {
    await _secureStorage.write(key: _tokenExpiryKey, value: expiry.toIso8601String());
  }

  /// Get token expiry
  static Future<DateTime?> getTokenExpiry() async {
    final expiryString = await _secureStorage.read(key: _tokenExpiryKey);
    if (expiryString != null) {
      return DateTime.parse(expiryString);
    }
    return null;
  }

  /// Save all tokens at once
  static Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
    DateTime? expiry,
  }) async {
    await saveAccessToken(accessToken);
    if (refreshToken != null) {
      await saveRefreshToken(refreshToken);
    }
    if (expiry != null) {
      await saveTokenExpiry(expiry);
    }
  }

  /// Clear all tokens
  static Future<void> clearTokens() async {
    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _tokenExpiryKey);
  }

  /// Check if tokens exist
  static Future<bool> hasTokens() async {
    final accessToken = await getAccessToken();
    return accessToken != null;
  }

  /// Clear all secure storage
  static Future<void> clearAll() async {
    await _secureStorage.deleteAll();
  }

  /// Set onboarding as completed
  static Future<void> setOnboardingCompleted(bool completed) async {
    await _secureStorage.write(key: _onboardingCompletedKey, value: completed.toString());
  }

  /// Check if onboarding is completed
  static Future<bool> isOnboardingCompleted() async {
    final value = await _secureStorage.read(key: _onboardingCompletedKey);
    return value == 'true';
  }
}
