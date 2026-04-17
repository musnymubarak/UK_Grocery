"""
Driver service — manage availability and driver stats.
"""
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.driver import DriverProfile
from app.models.user import User
from app.core.exceptions import NotFoundException, ValidationException

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
