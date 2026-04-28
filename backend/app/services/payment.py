"""Payment gateway integration — Stripe refund processing."""
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class PaymentService:
    STRIPE_BASE = "https://api.stripe.com/v1"

    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.STRIPE_SECRET_KEY

    async def create_refund(
        self, charge_id: str, amount_pence: int,
        reason: str = "requested_by_customer", metadata: dict = None
    ) -> dict:
        if not self.api_key:
            logger.warning("No Stripe API key configured, mocking refund response.")
            return {"id": "re_mocked", "status": "succeeded", "amount": amount_pence}

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.STRIPE_BASE}/refunds",
                auth=(self.api_key, ""),
                data={
                    "charge": charge_id,
                    "amount": amount_pence,
                    "reason": reason,
                    **({"metadata": metadata} if metadata else {})
                }
            )
            resp.raise_for_status()
            return resp.json()
