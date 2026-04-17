from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class WalletTransactionResponse(BaseModel):
    id: UUID
    customer_id: UUID
    amount: Decimal
    transaction_type: str
    source: str
    reference_id: Optional[UUID] = None
    notes: Optional[str] = None
    balance_after: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WalletBalanceResponse(BaseModel):
    balance: Decimal
    transactions: List[WalletTransactionResponse] = []
