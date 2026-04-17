"""Review service — create, list, and moderate reviews."""
from uuid import UUID
from typing import List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Review
from app.models.order import Order
from app.core.exceptions import NotFoundException, ValidationException

class ReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_review(
        self, customer_id: UUID, order_id: UUID,
        store_rating: int, delivery_rating: int = None, comment: str = None
    ) -> Review:
        """Customer leaves a review after delivery."""
        order = await self.db.get(Order, order_id)
        if not order or order.customer_id != customer_id:
            raise NotFoundException("Order", order_id)
        if order.status != "delivered":
            raise ValidationException("You can only review delivered orders")

        # Check for duplicate review
        existing = await self.db.execute(
            select(Review).where(Review.order_id == order_id)
        )
        if existing.scalar_one_or_none():
            raise ValidationException("You have already reviewed this order")

        review = Review(
            order_id=order_id,
            customer_id=customer_id,
            store_id=order.store_id,
            store_rating=store_rating,
            delivery_rating=delivery_rating,
            comment=comment,
        )
        self.db.add(review)
        await self.db.flush()
        return review

    async def get_store_reviews(
        self, store_id: UUID, skip: int = 0, limit: int = 20
    ) -> List[Review]:
        query = (
            select(Review)
            .where(Review.store_id == store_id, Review.is_published == True)
            .order_by(Review.created_at.desc())
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_store_rating_summary(self, store_id: UUID) -> dict:
        query = select(
            func.avg(Review.store_rating).label("avg"),
            func.count(Review.id).label("count"),
        ).where(Review.store_id == store_id, Review.is_published == True)
        result = await self.db.execute(query)
        row = result.one()
        return {
            "store_id": store_id,
            "average_rating": round(float(row.avg or 0), 1),
            "total_reviews": row.count or 0,
        }

    async def toggle_publish(self, review_id: UUID, publish: bool) -> Review:
        """Admin: show/hide a review."""
        review = await self.db.get(Review, review_id)
        if not review:
            raise NotFoundException("Review", review_id)
        review.is_published = publish
        await self.db.flush()
        return review

    async def add_store_response(self, review_id: UUID, response_text: str) -> Review:
        """Store manager responds to a review."""
        review = await self.db.get(Review, review_id)
        if not review:
            raise NotFoundException("Review", review_id)
        review.store_response = response_text
        await self.db.flush()
        return review
