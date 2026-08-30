import Flutter
import UIKit
import UserNotifications

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Called from SceneDelegate once `window` (and its FlutterViewController)
  // actually exists — this app uses the UIScene lifecycle, so `self.window`
  // here in AppDelegate is nil for the entire didFinishLaunchingWithOptions
  // call (see the matching note in SceneDelegate.swift for the Stripe case).
  func registerBadgeChannel(messenger: FlutterBinaryMessenger) {
    let badgeChannel = FlutterMethodChannel(
      name: "com.dailygrocer.app/badge",
      binaryMessenger: messenger
    )
    badgeChannel.setMethodCallHandler { call, result in
      guard call.method == "clearBadge" else {
        result(FlutterMethodNotImplemented)
        return
      }
      if #available(iOS 16.0, *) {
        UNUserNotificationCenter.current().setBadgeCount(0, withCompletionHandler: nil)
      } else {
        UIApplication.shared.applicationIconBadgeNumber = 0
      }
      result(nil)
    }
  }
}
