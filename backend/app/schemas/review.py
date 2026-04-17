from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    order_id: UUID
    store_rating: int = Field(..., ge=1, le=5)
    delivery_rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=2000)

class ReviewResponse(BaseModel):
    id: UUID
    order_id: UUID
    customer_id: UUID
    store_id: UUID
    store_rating: int
    delivery_rating: Optional[int] = None
    comment: Optional[str] = None
    is_published: bool
    store_response: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StoreRatingSummary(BaseModel):
    store_id: UUID
    average_rating: float
    total_reviews: int
