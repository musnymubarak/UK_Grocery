"""
Driver service — manage availability and driver stats.
"""
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.driver import DriverProfile
from app.models.user import User
from app.core.exceptions import NotFoundException, ValidationException
from app.core.security import hash_password

class DriverService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_profile(self, user_id: UUID) -> DriverProfile:
        """Get driver profile, creating one if it doesn't exist."""
        user = await self.db.get(User, user_id)
        if not user or user.role != "delivery_boy":
            raise ValidationException("User is not a delivery driver")
        
        query = select(DriverProfile).where(DriverProfile.user_id == user_id)
        result = await self.db.execute(query)
        profile = result.scalar_one_or_none()
        
        if not profile:
            profile = DriverProfile(user_id=user_id)
            self.db.add(profile)
            await self.db.flush()
        
        return profile

    async def toggle_availability(self, user_id: UUID, is_available: bool) -> DriverProfile:
        """Set driver availability and online status."""
        profile = await self.get_or_create_profile(user_id)
        profile.is_available = is_available
        profile.is_online = is_available
        
        if is_available:
            profile.shift_start = datetime.now(timezone.utc)
        
        await self.db.flush()
        await self.db.refresh(profile)
        return profile

    async def get_available_drivers(self, store_id: Optional[UUID] = None) -> List[DriverProfile]:
        """Get all online and available drivers."""
        query = (
            select(DriverProfile)
            .join(User, User.id == DriverProfile.user_id)
            .where(
                DriverProfile.is_available == True,
                DriverProfile.is_online == True
            )
        )
        if store_id:
            query = query.where(User.store_id == store_id)
            
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def increment_deliveries(self, user_id: UUID):
        """Update total delivery count for a driver."""
        profile = await self.get_or_create_profile(user_id)
        profile.total_deliveries += 1
        await self.db.flush()

    async def list_drivers(self, org_id: UUID, store_id: Optional[UUID] = None) -> List[dict]:
        """List all delivery drivers in the org (with their profile + user info)."""
        query = (
            select(User)
            .where(User.organization_id == org_id, User.role == "delivery_boy")
            .options(selectinload(User.driver_profile))
            .order_by(User.full_name)
        )
        if store_id:
            query = query.where(User.store_id == store_id)
        result = await self.db.execute(query)
        users = result.scalars().all()
        rows = []
        for u in users:
            profile_list = u.driver_profile if isinstance(u.driver_profile, list) else ([u.driver_profile] if u.driver_profile else [])
            profile = profile_list[0] if profile_list else None
            rows.append({
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "phone": u.phone,
                "store_id": u.store_id,
                "is_active": u.is_active,
                "created_at": u.created_at,
                "vehicle_type": profile.vehicle_type if profile else None,
                "is_available": profile.is_available if profile else False,
                "is_online": profile.is_online if profile else False,
                "total_deliveries": profile.total_deliveries if profile else 0,
                "shift_start": profile.shift_start if profile else None,
            })
        return rows

    async def create_driver(
        self,
        org_id: UUID,
        email: str,
        password: str,
        full_name: str,
        phone: Optional[str] = None,
        store_id: Optional[UUID] = None,
        vehicle_type: Optional[str] = None,
    ) -> dict:
        """Create a new delivery driver: user row + driver profile in one transaction."""
        # Reject duplicate emails
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ValidationException("A user with this email already exists")
        user = User(
            organization_id=org_id,
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            phone=phone,
            role="delivery_boy",
            store_id=store_id,
            is_active=True,
        )
        self.db.add(user)
        await self.db.flush()
        profile = DriverProfile(
            user_id=user.id,
            vehicle_type=vehicle_type,
            is_available=False,
            is_online=False,
        )
        self.db.add(profile)
        await self.db.flush()
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "store_id": user.store_id,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "vehicle_type": profile.vehicle_type,
            "is_available": profile.is_available,
            "is_online": profile.is_online,
            "total_deliveries": profile.total_deliveries,
            "shift_start": profile.shift_start,
        }

    async def update_driver(
        self,
        org_id: UUID,
        user_id: UUID,
        full_name: Optional[str] = None,
        phone: Optional[str] = None,
        store_id: Optional[UUID] = None,
        vehicle_type: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> dict:
        """Edit a driver's profile fields. Only provided fields change."""
        user = await self.db.get(User, user_id)
        if not user or user.role != "delivery_boy" or user.organization_id != org_id:
            raise NotFoundException("Driver not found")

        if full_name is not None:
            user.full_name = full_name
        if phone is not None:
            user.phone = phone
        if store_id is not None:
            user.store_id = store_id
        if is_active is not None:
            user.is_active = is_active

        profile = await self.get_or_create_profile(user_id)
        if vehicle_type is not None:
            profile.vehicle_type = vehicle_type

        await self.db.flush()
        await self.db.refresh(user)
        await self.db.refresh(profile)
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "store_id": user.store_id,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "vehicle_type": profile.vehicle_type,
            "is_available": profile.is_available,
            "is_online": profile.is_online,
            "total_deliveries": profile.total_deliveries,
            "shift_start": profile.shift_start,
        }
