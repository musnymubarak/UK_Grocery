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

    let controller = window?.rootViewController as! FlutterViewController
    let badgeChannel = FlutterMethodChannel(
      name: "com.dailygrocer.app/badge",
      binaryMessenger: controller.binaryMessenger
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

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
