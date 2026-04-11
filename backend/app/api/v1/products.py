"""
Product management API routes.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_role, get_org_context
from app.services.product import ProductService
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", summary="List products")
async def list_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: UUID = Depends(get_org_context),
    category_id: Optional[UUID] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
):
    """List products with search and filtering."""
    service = ProductService(db)
    products, total = await service.list_products(
        org_id=org_id,
        category_id=category_id,
        search=search,
        skip=skip,
        limit=limit,
    )
    return {
        "items": [ProductResponse.model_validate(p) for p in products],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.post("", response_model=ProductResponse, summary="Create product")
async def create_product(
    data: ProductCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
    org_id: UUID = Depends(get_org_context),
):
    """Create a new product (admin/manager only)."""
    service = ProductService(db)
    return await service.create_product(data, org_id, user=current_user, request=request)


@router.get("/low-stock", summary="Low stock alerts")
async def get_low_stock(
    store_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: UUID = Depends(get_org_context),
):
    """Get products below their low stock threshold."""
    service = ProductService(db)
    return await service.get_low_stock_products(org_id, store_id)


@router.get("/{product_id}", response_model=ProductResponse, summary="Get product")
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: UUID = Depends(get_org_context),
):
    """Get product by ID."""
    service = ProductService(db)
    return await service.get_product(product_id, org_id)


@router.put("/{product_id}", response_model=ProductResponse, summary="Update product")
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
    org_id: UUID = Depends(get_org_context),
):
    """Update product (admin/manager only)."""
    service = ProductService(db)
    return await service.update_product(product_id, data, org_id, user=current_user, request=request)


@router.delete("/{product_id}", summary="Delete product")
async def delete_product(
    product_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
    org_id: UUID = Depends(get_org_context),
):
    """Soft delete product (admin/manager only)."""
    service = ProductService(db)
    await service.delete_product(product_id, org_id, user=current_user, request=request)
    return {"message": "Product deleted", "success": True}


@router.post("/{product_id}/image", response_model=ProductResponse, summary="Upload product image")
async def upload_product_image(
    product_id: UUID,
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
    org_id: UUID = Depends(get_org_context),
):
    """Upload product image (admin/manager only)."""
    service = ProductService(db)
    return await service.upload_product_image(product_id, image, org_id)
