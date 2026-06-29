"""
Payment router - endpoints for Stripe payment processing.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from decimal import Decimal

from app.core.dependencies import get_current_customer, get_db
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.services.payment import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentIntentRequest(BaseModel):
    amount: Decimal
    currency: str = "gbp"
    save_card: bool = False
    payment_method_id: str = None

class PaymentIntentResponse(BaseModel):
    client_secret: str
    id: str
    status: str

@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    data: PaymentIntentRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Create a Stripe PaymentIntent and return the client_secret."""
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    # Convert Decimal to pence (e.g. 10.50 -> 1050)
    amount_pence = int(data.amount * 100)

    payment_service = PaymentService()
    try:
        if not current_customer.stripe_customer_id:
            cust = await payment_service.create_customer(email=current_customer.email, name=current_customer.full_name)
            current_customer.stripe_customer_id = cust["id"]
            db.commit()

        intent = await payment_service.create_payment_intent(
            amount_pence=amount_pence,
            currency=data.currency,
            metadata={"customer_id": str(current_customer.id)},
            stripe_customer_id=current_customer.stripe_customer_id,
            save_card=data.save_card,
            payment_method_id=data.payment_method_id
        )
        return PaymentIntentResponse(
            client_secret=intent["client_secret"],
            id=intent["id"],
            status=intent["status"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/methods")
async def get_payment_methods(
    current_customer: Customer = Depends(get_current_customer)
):
    """Get the customer's saved payment methods."""
    if not current_customer.stripe_customer_id:
        return {"data": []}
        
    payment_service = PaymentService()
    try:
        methods = await payment_service.list_payment_methods(current_customer.stripe_customer_id)
        return {"data": methods}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
