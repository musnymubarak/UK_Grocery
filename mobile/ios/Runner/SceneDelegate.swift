import Flutter
import UIKit
import Stripe

class SceneDelegate: FlutterSceneDelegate {
  override func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    super.scene(scene, willConnectTo: session, options: connectionOptions)
    // IMPORTANT: flutter_stripe relies on UIApplication.shared.delegate.window to present modals like 3DS
    // When using SceneDelegate, this is nil by default. We must explicitly link it!
    if let window = self.window {
      if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
        appDelegate.window = window
      }
    }
  }

  override func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else {
      super.scene(scene, openURLContexts: URLContexts)
      return
    }

    let stripeHandled = StripeAPI.handleURLCallback(with: url)
    if !stripeHandled {
      super.scene(scene, openURLContexts: URLContexts)
    }
  }
}

