from sqlalchemy import Column, String, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin

class RefundEvidence(TimestampMixin, Base):
    __tablename__ = "refund_evidence"
    
    refund_item_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("refund_items.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    file_url = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_by_customer_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("customers.id", ondelete="SET NULL"), 
        nullable=True
    )
    is_deleted = Column(Boolean, default=False, nullable=False)
