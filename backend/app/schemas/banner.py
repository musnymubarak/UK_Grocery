from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional
from datetime import datetime

class BannerBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_url: str
    link_url: Optional[str] = None
    position: Optional[int] = 0
    is_active: Optional[bool] = True
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    store_id: Optional[UUID] = None

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    position: Optional[int] = None
    is_active: Optional[bool] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    store_id: Optional[UUID] = None

class BannerResponse(BannerBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
