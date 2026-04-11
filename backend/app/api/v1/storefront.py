"""
Public Storefront API — unauthenticated endpoints for the B2C customer shop.
These endpoints let customers browse products, categories, and stores
without needing an admin JWT token.
"""
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_async_session
from app.models.organization import Organization
from app.models.store import Store
from app.models.product import Product
from app.models.category import Category
from app.models.inventory import Inventory
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/storefront", tags=["Storefront (Public)"])


async def _get_default_org(db: AsyncSession) -> Organization:
    """Get the first (default) organization. Single-org deployment."""
    result = await db.execute(select(Organization).limit(1))
    org = result.scalar_one_or_none()
    if not org:
        raise NotFoundException("Organization", "default")
    return org


@router.get("/products", summary="Browse products (public)")
async def list_products(
    category_id: Optional[UUID] = None,
    store_id: Optional[UUID] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Public product listing for storefront.
    Optionally filter by category or search term.
    If store_id is provided, includes stock quantity for that store.
    """
    org = await _get_default_org(db)

    query = select(Product).where(
        Product.organization_id == org.id,
        Product.is_deleted == False,
    )

    if category_id:
        query = query.where(Product.category_id == category_id)

    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = query.order_by(Product.name).offset(skip).limit(limit)
    result = await db.execute(query)
    products = list(result.scalars().all())

    # If store_id provided, attach stock info
    items = []
    for p in products:
        item = {
            "id": str(p.id),
            "name": p.name,
            "sku": p.sku,
            "description": getattr(p, 'description', None),
            "price": float(p.selling_price),
            "category_id": str(p.category_id) if p.category_id else None,
            "category_name": None,
            "image_url": getattr(p, 'image_url', None),
            "unit": getattr(p, 'unit', None),
            "is_active": getattr(p, 'is_active', True),
        }
        items.append(item)

    # Batch load category names
    cat_ids = {p.category_id for p in products if p.category_id}
    if cat_ids:
        cat_result = await db.execute(
            select(Category).where(Category.id.in_(cat_ids))
        )
        cat_map = {str(c.id): c.name for c in cat_result.scalars().all()}
        for item in items:
            if item["category_id"]:
                item["category_name"] = cat_map.get(item["category_id"])

    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
    }


@router.get("/products/{product_id}", summary="Product detail (public)")
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_async_session),
):
    """Get single product detail for the storefront."""
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.is_deleted == False,
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product", product_id)

    # Load category name
    cat_name = None
    if product.category_id:
        cat_result = await db.execute(
            select(Category.name).where(Category.id == product.category_id)
        )
        cat_name = cat_result.scalar_one_or_none()

    return {
        "id": str(product.id),
        "name": product.name,
        "sku": product.sku,
        "description": getattr(product, 'description', None),
        "price": float(product.selling_price),
        "category_id": str(product.category_id) if product.category_id else None,
        "category_name": cat_name,
        "image_url": getattr(product, 'image_url', None),
        "unit": getattr(product, 'unit', None),
    }


@router.get("/categories", summary="Browse categories (public)")
async def list_categories(
    db: AsyncSession = Depends(get_async_session),
):
    """Public category listing for storefront navigation."""
    org = await _get_default_org(db)

    result = await db.execute(
        select(Category).where(
            Category.organization_id == org.id,
            Category.is_deleted == False,
        ).order_by(Category.name)
    )
    categories = result.scalars().all()

    return [
        {
            "id": str(c.id),
            "name": c.name,
            "description": getattr(c, 'description', None),
            "image_url": getattr(c, 'image_url', None),
        }
        for c in categories
    ]


@router.get("/stores", summary="List store locations (public)")
async def list_stores(
    db: AsyncSession = Depends(get_async_session),
):
    """Public store listing for customers to select their pickup/delivery store."""
    org = await _get_default_org(db)

    result = await db.execute(
        select(Store).where(
            Store.organization_id == org.id,
            Store.is_deleted == False,
        ).order_by(Store.name)
    )
    stores = result.scalars().all()

    return [
        {
            "id": str(s.id),
            "name": s.name,
            "address": getattr(s, 'address', None),
            "city": getattr(s, 'city', None),
            "postcode": getattr(s, 'postcode', None),
            "phone": getattr(s, 'phone', None),
            "is_active": getattr(s, 'is_active', True),
        }
        for s in stores
    ]


@router.get("/stores/{store_id}/stock", summary="Store stock levels (public)")
async def get_store_stock(
    store_id: UUID,
    category_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Get products with stock levels for a specific store.
    Useful for showing 'In Stock' / 'Out of Stock' on the storefront.
    """
    query = (
        select(Product, Inventory.quantity)
        .outerjoin(Inventory, (Inventory.product_id == Product.id) & (Inventory.store_id == store_id))
        .where(Product.is_deleted == False)
    )

    if category_id:
        query = query.where(Product.category_id == category_id)

    query = query.order_by(Product.name).offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "price": float(p.selling_price),
            "category_id": str(p.category_id) if p.category_id else None,
            "image_url": getattr(p, 'image_url', None),
            "unit": getattr(p, 'unit', None),
            "stock": qty or 0,
            "in_stock": (qty or 0) > 0,
        }
        for p, qty in rows
    ]
