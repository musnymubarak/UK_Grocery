from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from uuid import UUID
from datetime import datetime

class PlatformConfigCreate(BaseModel):
    key: str
    value: Any
    description: Optional[str] = None
    setting_type: Optional[str] = "string"

class PlatformConfigUpdate(BaseModel):
    value: Any

class PlatformConfigResponse(BaseModel):
    id: UUID
    organization_id: UUID
    key: str
    value: Any
    description: Optional[str] = None
    setting_type: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeatureFlagCreate(BaseModel):
    key: str
    is_enabled: bool
    description: Optional[str] = None

class FeatureFlagUpdate(BaseModel):
    is_enabled: bool

class FeatureFlagResponse(BaseModel):
    id: UUID
    organization_id: UUID
    key: str
    is_enabled: bool
    description: Optional[str] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
