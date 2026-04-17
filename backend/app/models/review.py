"""
Review model — post-delivery ratings for stores and products.
"""
from sqlalchemy import Column, String, ForeignKey, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin

class Review(TimestampMixin, Base):
    __tablename__ = "reviews"

    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    store_id = Column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    store_rating = Column(Integer, nullable=False)  # 1-5
    delivery_rating = Column(Integer, nullable=True)  # 1-5, null if collection
    comment = Column(Text, nullable=True)
    is_published = Column(Boolean, default=True, nullable=False)  # admin can hide
    store_response = Column(Text, nullable=True)  # store can reply

    # Relationships
    order = relationship("Order")
    customer = relationship("Customer")
    store = relationship("Store")

    def __repr__(self):
        return f"<Review(order={self.order_id}, store_rating={self.store_rating})>"
