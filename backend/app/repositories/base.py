"""
Generic base repository with CRUD operations, soft delete, and pagination.
"""
from typing import TypeVar, Generic, Optional, List, Type, Any, Dict
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    """Generic repository providing standard CRUD operations."""

    def __init__(self, model: Type[T], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id: UUID, include_deleted: bool = False) -> Optional[T]:
        """Get a single record by ID."""
        query = select(self.model).where(self.model.id == id)
        if not include_deleted and hasattr(self.model, "is_deleted"):
            query = query.where(self.model.is_deleted == False)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        filters: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 100,
        order_by: Optional[str] = None,
        include_deleted: bool = False,
    ) -> List[T]:
        """Get all records with optional filters, pagination, and ordering."""
        query = select(self.model)

        if not include_deleted and hasattr(self.model, "is_deleted"):
            query = query.where(self.model.is_deleted == False)

        if filters:
            conditions = []
            for key, value in filters.items():
                if hasattr(self.model, key):
                    conditions.append(getattr(self.model, key) == value)
            if conditions:
                query = query.where(and_(*conditions))

        if order_by and hasattr(self.model, order_by):
            query = query.order_by(getattr(self.model, order_by).desc())
        elif hasattr(self.model, "created_at"):
            query = query.order_by(self.model.created_at.desc())

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count(
        self,
        filters: Optional[Dict[str, Any]] = None,
        include_deleted: bool = False,
    ) -> int:
        """Count records with optional filters."""
        query = select(func.count()).select_from(self.model)

        if not include_deleted and hasattr(self.model, "is_deleted"):
            query = query.where(self.model.is_deleted == False)

        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)

        result = await self.session.execute(query)
        return result.scalar() or 0

    async def create(self, data: Dict[str, Any]) -> T:
        """Create a new record."""
        instance = self.model(**data)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def update(self, id: UUID, data: Dict[str, Any]) -> Optional[T]:
        """Update an existing record."""
        instance = await self.get_by_id(id)
        if not instance:
            return None
        for key, value in data.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def soft_delete(self, id: UUID) -> bool:
        """Soft delete a record."""
        instance = await self.get_by_id(id)
        if not instance:
            return False
        instance.is_deleted = True
        await self.session.flush()
        return True

    async def hard_delete(self, id: UUID) -> bool:
        """Permanently delete a record."""
        instance = await self.get_by_id(id, include_deleted=True)
        if not instance:
            return False
        await self.session.delete(instance)
        await self.session.flush()
        return True
