import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import 'secure_storage_service.dart';
import '../network/api_client.dart';
import 'token_refresh_service.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  WebSocketChannel? _channel;
  bool _isConnected = false;
  String? _userId;
  String? _accessToken;
  final Map<String, Function(Map<String, dynamic>)> _listeners = {};
  Timer? _reconnectTimer;
  Timer? _heartbeatTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  static const Duration _reconnectDelay = Duration(seconds: 5);
  static const Duration _heartbeatInterval = Duration(seconds: 30);

  /// Initialize WebSocket connection
  Future<void> initialize(String userId, String accessToken) async {
    _userId = userId;
    _accessToken = accessToken;
    
    if (!_isConnected) {
      await _connect();
    }
  }

  /// Connect to WebSocket server
  Future<void> _connect() async {
    try {
      if (_isConnected) return;

      // Refresh token before connecting
      await _refreshTokenIfNeeded();
      
      // LOCAL DEVELOPMENT - Android Emulator uses 10.0.2.2 to access host's localhost
      // For physical device, use your computer's IP (e.g., 192.168.x.x:5002)
      // NOTE: Backend runs on port 5002 (not 5000) because port 5000 is used by macOS AirPlay
      final wsUrl = 'ws://10.0.2.2:5002/ws?token=$_accessToken';
      print('🔌 Connecting to WebSocket: $wsUrl');

      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      
      _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnect,
      );

      _isConnected = true;
      _reconnectAttempts = 0;
      
      // Start heartbeat
      _startHeartbeat();
      
      print('✅ WebSocket connected successfully');
    } catch (e) {
      print('❌ WebSocket connection failed: $e');
      _scheduleReconnect();
    }
  }

  /// Handle incoming messages
  void _handleMessage(dynamic message) {
    try {
      final data = json.decode(message);
      print('📨 WebSocket message received: ${data['type']}');
      
      // Handle different message types
      switch (data['type']) {
        case 'connection':
          print('✅ WebSocket connection confirmed');
          break;
        case 'notification':
          _handleNotification(data['data']);
          break;
        case 'event_update':
          _handleEventUpdate(data);
          break;
        case 'registration_update':
          _handleRegistrationUpdate(data);
          break;
        case 'pong':
          // Heartbeat response
          break;
        default:
          print('⚠️ Unknown WebSocket message type: ${data['type']}');
      }
      
      // Notify listeners
      _notifyListeners(data);
    } catch (e) {
      print('❌ Error parsing WebSocket message: $e');
    }
  }

  /// Handle notification messages
  void _handleNotification(Map<String, dynamic> notification) {
    print('🔔 Real-time notification: ${notification['title']}');
    // You can emit this to a BLoC or use a callback
    _notifyListeners({
      'type': 'notification_received',
      'data': notification
    });
  }

  /// Handle event update messages
  void _handleEventUpdate(Map<String, dynamic> data) {
    print('📅 Event update received for event: ${data['eventId']}');
    _notifyListeners({
      'type': 'event_updated',
      'data': data
    });
  }

  /// Handle registration update messages
  void _handleRegistrationUpdate(Map<String, dynamic> data) {
    print('📝 Registration update received for event: ${data['eventId']}');
    _notifyListeners({
      'type': 'registration_updated',
      'data': data
    });
  }

  /// Handle WebSocket errors
  void _handleError(dynamic error) {
    print('❌ WebSocket error: $error');
    _isConnected = false;
    _scheduleReconnect();
  }

  /// Handle WebSocket disconnect
  void _handleDisconnect() {
    print('🔌 WebSocket disconnected');
    _isConnected = false;
    _stopHeartbeat();
    _scheduleReconnect();
  }

  /// Schedule reconnection
  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      print('❌ Max reconnection attempts reached');
      return;
    }

    _reconnectAttempts++;
    print('🔄 Scheduling reconnection attempt $_reconnectAttempts/$_maxReconnectAttempts');
    
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay, () {
      _connect();
    });
  }

  /// Start heartbeat to keep connection alive
  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(_heartbeatInterval, (timer) {
      if (_isConnected && _channel != null) {
        _sendMessage({
          'type': 'ping',
          'timestamp': DateTime.now().toIso8601String()
        });
      }
    });
  }

  /// Stop heartbeat
  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
  }

  /// Send message to WebSocket server
  void _sendMessage(Map<String, dynamic> message) {
    if (_isConnected && _channel != null) {
      try {
        _channel!.sink.add(json.encode(message));
      } catch (e) {
        print('❌ Error sending WebSocket message: $e');
      }
    }
  }

  /// Join a room (e.g., event room)
  void joinRoom(String roomId) {
    _sendMessage({
      'type': 'join_room',
      'roomId': roomId
    });
    print('🏠 Joined room: $roomId');
  }

  /// Leave a room
  void leaveRoom(String roomId) {
    _sendMessage({
      'type': 'leave_room',
      'roomId': roomId
    });
    print('🚪 Left room: $roomId');
  }

  /// Join event room for real-time updates
  void joinEventRoom(String eventId) {
    joinRoom('event_$eventId');
  }

  /// Leave event room
  void leaveEventRoom(String eventId) {
    leaveRoom('event_$eventId');
  }

  /// Add message listener
  void addListener(String messageType, Function(Map<String, dynamic>) callback) {
    _listeners[messageType] = callback;
  }

  /// Remove message listener
  void removeListener(String messageType) {
    _listeners.remove(messageType);
  }

  /// Notify all listeners
  void _notifyListeners(Map<String, dynamic> data) {
    final messageType = data['type'];
    final callback = _listeners[messageType];
    if (callback != null) {
      try {
        callback(data);
      } catch (e) {
        print('❌ Error in WebSocket listener: $e');
      }
    }
  }

  /// Check if connected
  bool get isConnected => _isConnected;

  /// Refresh token if needed before WebSocket connection
  Future<void> _refreshTokenIfNeeded() async {
    try {
      final tokenRefreshService = TokenRefreshService();
      final apiClient = ApiClient();
      final needsRefresh = await apiClient.needsTokenRefresh();
      
      if (needsRefresh) {
        print('🔄 WebSocket: Token needs refresh, refreshing...');
        final success = await tokenRefreshService.refreshTokenNow();
        if (success) {
          // Update access token
          _accessToken = await _getAccessToken();
          print('✅ WebSocket: Token refreshed successfully');
        } else {
          print('❌ WebSocket: Token refresh failed');
          throw Exception('Token refresh failed');
        }
      } else {
        print('✅ WebSocket: Token is still valid');
      }
    } catch (e) {
      print('❌ WebSocket: Token refresh error: $e');
      throw e;
    }
  }

  /// Get access token from secure storage
  Future<String?> _getAccessToken() async {
    return await SecureStorageService.getAccessToken();
  }

  /// Get connection status
  String get connectionStatus {
    if (_isConnected) return 'Connected';
    if (_reconnectAttempts > 0) return 'Reconnecting...';
    return 'Disconnected';
  }

  /// Disconnect WebSocket
  void disconnect() {
    print('🔌 Disconnecting WebSocket...');
    _reconnectTimer?.cancel();
    _stopHeartbeat();
    _channel?.sink.close(status.goingAway);
    _isConnected = false;
    _listeners.clear();
  }

  /// Reconnect WebSocket
  Future<void> reconnect() async {
    disconnect();
    await Future.delayed(const Duration(seconds: 1));
    await _connect();
  }
}

