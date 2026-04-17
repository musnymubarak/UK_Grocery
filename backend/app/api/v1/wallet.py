"""Wallet API — customer balance and transaction history."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_current_customer
from app.models.customer import Customer
from app.services.wallet import WalletService
from app.schemas.wallet import WalletBalanceResponse

router = APIRouter(prefix="/wallet", tags=["Wallet"])

@router.get("/me", response_model=WalletBalanceResponse)
async def get_my_wallet(
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Get current wallet balance and recent transactions."""
    service = WalletService(db)
    balance = await service.get_balance(current_customer.id)
    transactions = await service.get_history(current_customer.id, limit=20)
    return WalletBalanceResponse(balance=balance, transactions=transactions)
