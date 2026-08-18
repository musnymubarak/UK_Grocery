// File generated for Daily Grocer Firebase configuration.
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'DefaultFirebaseOptions have not been configured for web',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAHHMqVy-1EtyvJbjz-OpXSx1vJbIi6kd8',
    appId: '1:721475838135:android:6a404acbf76cff91a4ad32',
    messagingSenderId: '721475838135',
    projectId: 'daily-grocer-dbe1d',
    storageBucket: 'daily-grocer-dbe1d.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyA408e51tJq0oyTSl3T3eN0z8mgwCQvBEA',
    appId: '1:721475838135:ios:e9ac662bfc2ae199a4ad32',
    messagingSenderId: '721475838135',
    projectId: 'daily-grocer-dbe1d',
    storageBucket: 'daily-grocer-dbe1d.firebasestorage.app',
    iosBundleId: 'uk.co.dailygrocer',
  );
}
