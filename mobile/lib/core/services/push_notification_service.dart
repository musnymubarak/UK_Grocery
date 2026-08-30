import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../data/api/api_registry.dart';
import '../../firebase_options.dart';
import '../utils/notification_router.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  if (kDebugMode) {
    print('Handling background FCM message: ${message.messageId}');
  }
}

class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  // MUST stay lazy. As an eager field initializer this ran during construction of
  // the `instance` singleton and threw [core/no-app] before Firebase.initializeApp()
  // had a chance to run, which broke every caller — including Apple/Google sign-in.
  FirebaseMessaging get _messaging => FirebaseMessaging.instance;

  final FlutterLocalNotificationsPlugin _localNotifs =
      FlutterLocalNotificationsPlugin();

  static const MethodChannel _badgeChannel =
      MethodChannel('com.dailygrocer.app/badge');

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'high_importance_channel',
    'High Importance Notifications',
    description: 'Used for important order updates and announcements.',
    importance: Importance.high,
  );

  bool _initialized = false;
  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  Future<void> initialize({GlobalKey<NavigatorState>? navigatorKey}) async {
    if (_initialized) return;

    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform,
        );
      }
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Notification settings / permissions
      final settings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (kDebugMode) {
        print('FCM Permission status: ${settings.authorizationStatus}');
      }

      // iOS foreground heads-up display options
      await _messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // Initialize local notifications for Android & iOS foreground heads-up
      const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosInit = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      const initSettings = InitializationSettings(android: androidInit, iOS: iosInit);

      await _localNotifs.initialize(
        initSettings,
        onDidReceiveNotificationResponse: (response) {
          _handleNotificationTap(response.payload, navigatorKey);
        },
      );

      // Create Android channel
      final androidPlatform = _localNotifs
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      if (androidPlatform != null) {
        await androidPlatform.createNotificationChannel(_channel);
      }

      // Listen for foreground FCM messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        final notification = message.notification;
        final android = message.notification?.android;

        if (notification != null) {
          _localNotifs.show(
            notification.hashCode,
            notification.title,
            notification.body,
            NotificationDetails(
              android: AndroidNotificationDetails(
                _channel.id,
                _channel.name,
                channelDescription: _channel.description,
                icon: android?.smallIcon ?? '@mipmap/ic_launcher',
                importance: Importance.high,
                priority: Priority.high,
              ),
              iOS: const DarwinNotificationDetails(
                presentAlert: true,
                presentBadge: true,
                presentSound: true,
              ),
            ),
            // Both fields, not just one — the tap handler needs the type to
            // know which screen to open, and the id to know which record.
            payload: '${message.data['notification_type'] ?? ''}|${message.data['reference_id'] ?? ''}',
          );
        }
      });

      // Handle notification opened from background state
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        _handleRemoteMessageNavigation(message, navigatorKey);
      });

      // Check for initial message (cold start)
      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleRemoteMessageNavigation(initialMessage, navigatorKey);
      }

      // Capture FCM Token & wait for APNs on iOS
      if (Platform.isIOS) {
        await _localNotifs
            .resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()
            ?.requestPermissions(alert: true, badge: true, sound: true);

        for (int i = 0; i < 6; i++) {
          final apns = await _messaging.getAPNSToken();
          if (apns != null) break;
          await Future.delayed(const Duration(milliseconds: 500));
        }
      }

      _fcmToken = await _messaging.getToken();
      if (kDebugMode) {
        print('FCM Device Token: $_fcmToken');
      }
      if (_fcmToken != null && _fcmToken!.isNotEmpty) {
        await syncTokenWithBackend();
      }

      // Listen for token refresh
      _messaging.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        syncTokenWithBackend();
      });

      _initialized = true;
    } catch (e) {
      if (kDebugMode) {
        print('Failed to initialize push notifications: $e');
      }
    }
  }

  /// Sync current FCM token with backend API if user is authenticated.
  Future<void> syncTokenWithBackend() async {
    final token = _fcmToken;
    if (token == null || token.isEmpty) return;

    try {
      final platform = Platform.isIOS ? 'ios' : 'android';
      await Api.instance.notifications.registerDeviceToken(
        fcmToken: token,
        platform: platform,
      );
      if (kDebugMode) {
        print('FCM Token registered with backend successfully.');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Could not sync FCM token with backend (user may not be logged in): $e');
      }
    }
  }

  /// Deactivate token on logout.
  Future<void> unregisterOnLogout() async {
    try {
      final token = _fcmToken;
      await Api.instance.notifications.unregisterDeviceToken(fcmToken: token);
    } catch (_) {}
    await clearBadge();
  }

  /// Clear the OS-level notification badge (iOS home-screen icon count).
  /// No-op on Android, which has no equivalent persistent icon badge here.
  Future<void> clearBadge() async {
    if (!Platform.isIOS) return;
    try {
      await _badgeChannel.invokeMethod('clearBadge');
    } catch (_) {}
  }

  void _handleRemoteMessageNavigation(RemoteMessage message, GlobalKey<NavigatorState>? navigatorKey) {
    final referenceId = message.data['reference_id'];
    final notifType = message.data['notification_type'];
    final navigator = navigatorKey?.currentState;
    if (navigator == null) return;
    routeForNotification(navigator, type: notifType, referenceId: referenceId);
  }

  void _handleNotificationTap(String? payload, GlobalKey<NavigatorState>? navigatorKey) {
    final parts = (payload ?? '').split('|');
    final notifType = parts.isNotEmpty && parts[0].isNotEmpty ? parts[0] : null;
    final referenceId = parts.length > 1 && parts[1].isNotEmpty ? parts[1] : null;
    final navigator = navigatorKey?.currentState;
    if (navigator == null) return;
    routeForNotification(navigator, type: notifType, referenceId: referenceId);
  }
}
