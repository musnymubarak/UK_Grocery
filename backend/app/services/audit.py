import logging
from uuid import UUID
import csv
import io
from datetime import datetime
from typing import Optional, List, Tuple
from uuid import UUID
from fastapi import Request
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.user import User

logger = logging.getLogger(__name__)

class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        action: str,
        user: User,
        organization_id: UUID,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID] = None,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None,
        store_id: Optional[UUID] = None,
        notes: Optional[str] = None,
        request: Optional[Request] = None,
    ):
        try:
            ip_address = None
            user_agent = None
            if request:
                # Get real IP if behind a proxy like Nginx or Cloudflare
                forwarded_for = request.headers.get("X-Forwarded-For")
                if forwarded_for:
                    ip_address = forwarded_for.split(",")[0].strip()
                else:
                    ip_address = request.headers.get("X-Real-IP", request.client.host if request.client else None)
                
                user_agent = request.headers.get("user-agent")

            log_entry = AuditLog(
                organization_id=organization_id,
                store_id=store_id,
                user_id=user.id,
                user_name=user.full_name,
                user_role=user.role,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                old_value=old_value,
                new_value=new_value,
                ip_address=ip_address,
                user_agent=user_agent,
                notes=notes,
            )
            self.db.add(log_entry)
            await self.db.flush()
        except Exception as e:
            # Audit logging must NEVER break the main transaction
            # Log the error but do not raise
            logger.error(f"Audit log failed: {e}")

    async def list_logs(
        self,
        organization_id: UUID,
        store_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[AuditLog], int]:
        filters = [AuditLog.organization_id == organization_id]
        
        if store_id:
            filters.append(or_(AuditLog.store_id == store_id, AuditLog.store_id.is_(None)))
        if user_id:
            filters.append(AuditLog.user_id == user_id)
        if action:
            filters.append(AuditLog.action == action)
        if entity_type:
            filters.append(AuditLog.entity_type == entity_type)
        if entity_id:
            filters.append(AuditLog.entity_id == entity_id)
        if start_date:
            filters.append(AuditLog.created_at >= start_date)
        if end_date:
            filters.append(AuditLog.created_at <= end_date)

        query = select(AuditLog).where(and_(*filters))
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Fetch paginated
        query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        logs = list(result.scalars().all())

        return logs, total

    async def export_csv(
        self,
        organization_id: UUID,
        store_id: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> str:
        """Export audit logs to CSV string."""
        filters = [AuditLog.organization_id == organization_id]
        if store_id:
            filters.append(or_(AuditLog.store_id == store_id, AuditLog.store_id.is_(None)))
        if start_date:
            filters.append(AuditLog.created_at >= start_date)
        if end_date:
            filters.append(AuditLog.created_at <= end_date)

        query = select(AuditLog).where(and_(*filters)).order_by(AuditLog.created_at.desc())
        result = await self.db.execute(query)
        logs = result.scalars().all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Timestamp", "User", "Role", "Action", "Entity Type", "Entity ID", "IP Address", "Notes"])
        
        for log in logs:
            writer.writerow([
                log.created_at.isoformat() if log.created_at else "",
                log.user_name or "",
                log.user_role or "",
                log.action or "",
                log.entity_type or "",
                str(log.entity_id) if log.entity_id else "",
                log.ip_address or "",
                log.notes or ""
            ])
            
        return output.getvalue()
