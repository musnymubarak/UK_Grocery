"""Review API — customer submit + public listing + admin moderation."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_current_customer, require_role, get_org_context
from app.models.customer import Customer
from app.models.user import User
from app.services.review import ReviewService
from app.schemas.review import ReviewCreate, ReviewResponse, StoreRatingSummary

router = APIRouter(prefix="/reviews", tags=["Reviews"])

# Customer endpoint
@router.post("", response_model=ReviewResponse)
async def submit_review(
    data: ReviewCreate,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Customer submits a review after delivery."""
    service = ReviewService(db)
    return await service.create_review(
        current_customer.id, data.order_id,
        data.store_rating, data.delivery_rating, data.comment,
    )

# Public endpoints (storefront)
@router.get("/store/{store_id}", response_model=List[ReviewResponse])
async def get_store_reviews(
    store_id: UUID,
    skip: int = 0, limit: int = 20,
    db: AsyncSession = Depends(get_async_session)
):
    """Public: list published reviews for a store."""
    service = ReviewService(db)
    return await service.get_store_reviews(store_id, skip, limit)

@router.get("/store/{store_id}/summary", response_model=StoreRatingSummary)
async def get_store_rating_summary(
    store_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Public: get average rating and count for a store."""
    service = ReviewService(db)
    return await service.get_store_rating_summary(store_id)

# Admin moderation
@router.patch("/{review_id}/toggle", response_model=ReviewResponse)
async def toggle_review_visibility(
    review_id: UUID,
    publish: bool = True,
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin: show or hide a review."""
    service = ReviewService(db)
    return await service.toggle_publish(review_id, publish)

@router.patch("/{review_id}/respond", response_model=ReviewResponse)
async def respond_to_review(
    review_id: UUID,
    response_text: str,
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Store staff responds to a review."""
    service = ReviewService(db)
    return await service.add_store_response(review_id, response_text)
