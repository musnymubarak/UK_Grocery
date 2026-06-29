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

    async def create_customer(self, email: str, name: str) -> dict:
        if not self.api_key:
            return {"id": "cus_mocked"}
            
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.STRIPE_BASE}/customers",
                auth=(self.api_key, ""),
                data={"email": email, "name": name}
            )
            resp.raise_for_status()
            return resp.json()

    async def list_payment_methods(self, customer_id: str) -> list:
        if not self.api_key:
            return []
            
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.STRIPE_BASE}/customers/{customer_id}/payment_methods",
                auth=(self.api_key, ""),
                params={"type": "card"}
            )
            resp.raise_for_status()
            return resp.json().get("data", [])

    async def create_payment_intent(
        self, amount_pence: int, currency: str = "gbp", metadata: dict = None,
        stripe_customer_id: str = None, save_card: bool = False, payment_method_id: str = None
    ) -> dict:
        if not self.api_key:
            logger.warning("No Stripe API key configured, mocking payment intent.")
            return {"client_secret": "pi_mocked_secret", "id": "pi_mocked"}

        async with httpx.AsyncClient() as client:
            data = {
                "amount": amount_pence,
                "currency": currency,
                "payment_method_types[]": "card",
            }
            if stripe_customer_id:
                data["customer"] = stripe_customer_id
            if save_card:
                data["setup_future_usage"] = "off_session"
            if payment_method_id:
                data["payment_method"] = payment_method_id
                data["confirm"] = "true"
                data["off_session"] = "true"

            if metadata:
                for k, v in metadata.items():
                    data[f"metadata[{k}]"] = v
            
            resp = await client.post(
                f"{self.STRIPE_BASE}/payment_intents",
                auth=(self.api_key, ""),
                data=data
            )
            resp.raise_for_status()
            return resp.json()

    async def retrieve_payment_intent(self, intent_id: str) -> dict:
        if not self.api_key:
            logger.warning("No Stripe API key configured, mocking payment intent retrieval.")
            return {"status": "succeeded", "charges": {"data": [{"id": "ch_mocked"}]}}

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.STRIPE_BASE}/payment_intents/{intent_id}",
                auth=(self.api_key, "")
            )
            resp.raise_for_status()
            return resp.json()
