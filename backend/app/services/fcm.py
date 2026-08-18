"""
Firebase Cloud Messaging (FCM) push notification sender service.
"""
import os
import logging
from typing import List, Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

_firebase_initialized = False

def init_firebase() -> bool:
    """Initialize Firebase Admin SDK if not already initialized."""
    global _firebase_initialized
    if _firebase_initialized:
        return True

    try:
        import firebase_admin
        from firebase_admin import credentials

        # Check if default app already exists
        try:
            if firebase_admin.get_app():
                _firebase_initialized = True
                return True
        except ValueError:
            pass  # No default app

        # Locate service account JSON
        possible_paths = [
            settings.FIREBASE_CREDENTIALS_PATH,
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "firebase-service-account.json"),
            "/app/firebase-service-account.json",
            "firebase-service-account.json",
        ]

        cred_path = None
        for p in possible_paths:
            if p and os.path.exists(p):
                cred_path = p
                break

        if cred_path:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info(f"Firebase Admin SDK initialized successfully using {cred_path}")
            return True
        else:
            logger.warning("Firebase service account credentials file not found. Push notifications will be skipped.")
            return False

    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        return False


async def send_fcm_push(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Send push notification to a list of FCM device tokens.
    Returns summary of success and failure counts.
    """
    if not tokens:
        return {"success_count": 0, "failure_count": 0, "invalid_tokens": []}

    if not init_firebase():
        logger.warning(f"Push notification skipped (Firebase not initialized): {title}")
        return {"success_count": 0, "failure_count": len(tokens), "invalid_tokens": []}

    try:
        from firebase_admin import messaging

        # Ensure all data values are strings (FCM requirement)
        safe_data = {str(k): str(v) for k, v in (data or {}).items() if v is not None}

        # FCM multicast sends up to 500 tokens per batch
        success_count = 0
        failure_count = 0
        invalid_tokens: List[str] = []

        batch_size = 500
        for i in range(0, len(tokens), batch_size):
            batch = tokens[i : i + batch_size]
            multicast = messaging.MulticastMessage(
                tokens=batch,
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=safe_data,
                android=messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        sound="default",
                        channel_id="high_importance_channel",
                    ),
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound="default",
                            badge=1,
                        )
                    )
                ),
            )

            response = messaging.send_each_for_multicast(multicast)
            success_count += response.success_count
            failure_count += response.failure_count

            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    token = batch[idx]
                    err = resp.exception
                    # Check for unregistered or invalid tokens to prune
                    if err and hasattr(err, "code") and err.code in ("UNREGISTERED", "INVALID_ARGUMENT"):
                        invalid_tokens.append(token)
                    logger.debug(f"FCM delivery error for token {token[:10]}...: {err}")

        logger.info(f"FCM Push sent. Success: {success_count}, Failed: {failure_count}")
        return {
            "success_count": success_count,
            "failure_count": failure_count,
            "invalid_tokens": invalid_tokens,
        }

    except Exception as e:
        logger.error(f"Error sending FCM push notifications: {e}")
        return {"success_count": 0, "failure_count": len(tokens), "invalid_tokens": []}
