"""
StockMovement model — audit trail for all stock changes.
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin


class StockMovement(TimestampMixin, Base):
    __tablename__ = "stock_movements"

    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    store_id = Column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_store_id = Column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="SET NULL"),
        nullable=True,
    )
    quantity = Column(Integer, nullable=False)  # positive = in, negative = out
    movement_type = Column(
        String(50), nullable=False
    )  # purchase, sale, adjustment, transfer_in, transfer_out, return
    reference = Column(String(255), nullable=True)  # e.g., sale invoice number
    notes = Column(Text, nullable=True)
    performed_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    product = relationship("Product", back_populates="stock_movements")
    store = relationship("Store", back_populates="outgoing_movements", foreign_keys=[store_id])
    from_store = relationship("Store", back_populates="incoming_movements", foreign_keys=[from_store_id])

    def __repr__(self):
        return (
            f"<StockMovement(product={self.product_id}, "
            f"type='{self.movement_type}', qty={self.quantity})>"
        )
