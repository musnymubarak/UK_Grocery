from uuid import UUID
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.config import PlatformConfig, FeatureFlag
from app.schemas.config import PlatformConfigCreate, PlatformConfigUpdate, FeatureFlagCreate, FeatureFlagUpdate
from app.core.exceptions import NotFoundException

class ConfigService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Platform Configs ---
    async def get_all_configs(self, org_id: UUID) -> List[PlatformConfig]:
        query = select(PlatformConfig).where(PlatformConfig.organization_id == org_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_config_by_key(self, org_id: UUID, key: str) -> Optional[PlatformConfig]:
        query = select(PlatformConfig).where(
            PlatformConfig.organization_id == org_id,
            PlatformConfig.key == key
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def upsert_config(self, org_id: UUID, data: PlatformConfigCreate) -> PlatformConfig:
        config = await self.get_config_by_key(org_id, data.key)
        if config:
            config.value = data.value
            if data.description is not None:
                config.description = data.description
        else:
            config = PlatformConfig(
                organization_id=org_id,
                **data.model_dump()
            )
            self.db.add(config)
            
        await self.db.flush()
        await self.db.refresh(config)
        return config

    # --- Feature Flags ---
    async def get_all_flags(self, org_id: UUID) -> List[FeatureFlag]:
        query = select(FeatureFlag).where(FeatureFlag.organization_id == org_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_flag_by_key(self, org_id: UUID, key: str) -> Optional[FeatureFlag]:
        query = select(FeatureFlag).where(
            FeatureFlag.organization_id == org_id,
            FeatureFlag.key == key
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def upsert_flag(self, org_id: UUID, data: FeatureFlagCreate) -> FeatureFlag:
        flag = await self.get_flag_by_key(org_id, data.key)
        if flag:
            flag.is_enabled = data.is_enabled
            if data.description is not None:
                flag.description = data.description
        else:
            flag = FeatureFlag(
                organization_id=org_id,
                **data.model_dump()
            )
            self.db.add(flag)
            
        await self.db.flush()
        await self.db.refresh(flag)
        return flag

    async def is_enabled(self, org_id: UUID, key: str, default: bool = False) -> bool:
        """Helper to quickly check if a flag is on"""
        flag = await self.get_flag_by_key(org_id, key)
        if not flag:
            return default
        return flag.is_enabled
