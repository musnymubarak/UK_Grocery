"""
GDPR Compliance endpoints.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_current_customer, get_current_user, require_role
from app.models.customer import Customer
from app.models.user import User
from app.services.gdpr import GDPRService

router = APIRouter(prefix="/gdpr", tags=["GDPR & Compliance"])

@router.get("/export", summary="Export customer data (Self-service)")
async def export_self(
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Get all personal data associated with the authenticated customer account.
    """
    service = GDPRService(db)
    return await service.export_customer_data(customer.id)

@router.delete("/forget-me", status_code=status.HTTP_204_NO_CONTENT, summary="Deregister and anonymize account")
async def forget_me(
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Irreversibly anonymize the customer account and revoke all sessions.
    The account will be deactivated and PII removed.
    """
    service = GDPRService(db)
    await service.anonymize_customer(customer.id)
    return None

@router.post("/admin/anonymize/{customer_id}", summary="Admin-initiated anonymization")
async def admin_anonymize(
    customer_id: str,
    admin: User = Depends(require_role(["admin", "super_admin"])),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Admin-initiated account anonymization (e.g. upon support request).
    """
    from uuid import UUID
    service = GDPRService(db)
    await service.anonymize_customer(UUID(customer_id))
    return {"message": f"Customer {customer_id} has been anonymized"}
