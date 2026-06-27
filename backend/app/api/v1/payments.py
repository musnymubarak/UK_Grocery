"""
Payment router - endpoints for Stripe payment processing.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from decimal import Decimal

from app.core.dependencies import get_current_customer
from app.models.customer import Customer
from app.services.payment import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentIntentRequest(BaseModel):
    amount: Decimal
    currency: str = "gbp"

class PaymentIntentResponse(BaseModel):
    client_secret: str
    id: str

@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    data: PaymentIntentRequest,
    current_customer: Customer = Depends(get_current_customer)
):
    """Create a Stripe PaymentIntent and return the client_secret."""
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    # Convert Decimal to pence (e.g. 10.50 -> 1050)
    amount_pence = int(data.amount * 100)

    payment_service = PaymentService()
    try:
        intent = await payment_service.create_payment_intent(
            amount_pence=amount_pence,
            currency=data.currency,
            metadata={"customer_id": str(current_customer.id)}
        )
        return PaymentIntentResponse(
            client_secret=intent["client_secret"],
            id=intent["id"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
