import Flutter
import UIKit
import Stripe

class SceneDelegate: FlutterSceneDelegate {
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

