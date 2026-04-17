"""
Product service — CRUD, SKU generation, barcode/QR management.
"""
import uuid
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.inventory import Inventory
from app.models.stock_movement import StockMovement
from app.repositories.base import BaseRepository
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.exceptions import NotFoundException, ConflictException
from app.models.user import User
from app.services.audit import AuditService
from app.constants.audit_actions import AuditAction
from app.core.config import settings
from fastapi import Request, UploadFile
import os
import shutil

class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Product, db)
        self.audit = AuditService(db)

    def _serialize_product(self, p: Product) -> dict:
        return {
            "id": str(p.id) if p.id else None,
            "name": p.name,
            "sku": p.sku,
            "selling_price": float(p.selling_price) if p.selling_price is not None else None,
            "cost_price": float(p.cost_price) if p.cost_price is not None else None,
            "barcode": p.barcode,
            "tax_rate": float(p.tax_rate) if p.tax_rate is not None else None,
            "is_deleted": p.is_deleted,
            "category_id": str(p.category_id) if p.category_id else None,
            "member_price": float(p.member_price) if p.member_price is not None else None,
            "promo_price": float(p.promo_price) if p.promo_price is not None else None,
            "allergens": p.allergens,
            "is_age_restricted": p.is_age_restricted,
        }

    def _generate_sku(self, name: str, org_id: UUID) -> str:
        """Generate a unique SKU from product name."""
        prefix = "".join(c for c in name.upper() if c.isalpha())[:4]
        suffix = str(uuid.uuid4())[:6].upper()
        return f"{prefix}-{suffix}"

    async def create_product(self, data: ProductCreate, org_id: UUID, user: User, request: Optional[Request] = None) -> Product:
        """Create a new product with auto-generated SKU if not provided."""
        sku = data.sku or self._generate_sku(data.name, org_id)

        # Check SKU uniqueness
        result = await self.db.execute(
            select(Product).where(Product.sku == sku, Product.is_deleted == False)
        )
        if result.scalar_one_or_none():
            raise ConflictException(f"Product with SKU '{sku}' already exists")

        # Check barcode uniqueness if provided
        if data.barcode:
            result = await self.db.execute(
                select(Product).where(
                    Product.barcode == data.barcode, Product.is_deleted == False
                )
            )
            if result.scalar_one_or_none():
                raise ConflictException(f"Product with barcode '{data.barcode}' already exists")

        product_data = data.model_dump(exclude_unset=True, exclude={"store_id", "initial_stock"})
        product_data["sku"] = sku
        product_data["organization_id"] = org_id
        product_data["qr_code_data"] = f"product:{sku}"

        product = await self.repo.create(product_data)

        # Initialize inventory if store_id and initial_stock provided
        if data.store_id and data.initial_stock > 0:
            inv = Inventory(
                product_id=product.id,
                store_id=data.store_id,
                quantity=data.initial_stock,
            )
            self.db.add(inv)
            movement = StockMovement(
                product_id=product.id,
                store_id=data.store_id,
                quantity=data.initial_stock,
                movement_type="initial",
                reference="Initial stock on product creation",
            )
            self.db.add(movement)
            await self.db.flush()

        await self.audit.log(
            action=AuditAction.PRODUCT_CREATED,
            user=user,
            organization_id=org_id,
            entity_type="Product",
            entity_id=product.id,
            new_value=self._serialize_product(product),
            request=request,
        )

        return product

    async def update_product(self, product_id: UUID, data: ProductUpdate, org_id: UUID, user: User, request: Optional[Request] = None) -> Product:
        """Update product fields."""
        product = await self.repo.get_by_id(product_id)
        if not product or product.organization_id != org_id:
            raise NotFoundException("Product", product_id)

        old_val = self._serialize_product(product)
        old_price = product.selling_price

        update_data = data.model_dump(exclude_unset=True)
        updated_product = await self.repo.update(product_id, update_data)
        new_val = self._serialize_product(updated_product)

        await self.audit.log(
            action=AuditAction.PRODUCT_UPDATED,
            user=user,
            organization_id=org_id,
            entity_type="Product",
            entity_id=product.id,
            old_value=old_val,
            new_value=new_val,
            request=request,
        )

        if "selling_price" in update_data and old_price != updated_product.selling_price:
            await self.audit.log(
                action=AuditAction.PRODUCT_PRICE_CHANGED,
                user=user,
                organization_id=org_id,
                entity_type="Product",
                entity_id=product.id,
                old_value={"selling_price": float(old_price)},
                new_value={"selling_price": float(updated_product.selling_price)},
                request=request,
            )

        return updated_product

    async def get_product(self, product_id: UUID, org_id: UUID) -> Product:
        """Get single product by ID."""
        product = await self.repo.get_by_id(product_id)
        if not product or product.organization_id != org_id:
            raise NotFoundException("Product", product_id)
        return product

    async def list_products(
        self,
        org_id: UUID,
        category_id: Optional[UUID] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[Product], int]:
        """List products with optional filtering."""
        filters = {"organization_id": org_id}
        if category_id:
            filters["category_id"] = category_id

        if search:
            count_query = (
                select(func.count(Product.id))
                .where(
                    Product.organization_id == org_id,
                    Product.is_deleted == False,
                    or_(
                        Product.name.ilike(f"%{search}%"),
                        Product.sku.ilike(f"%{search}%"),
                        Product.barcode.ilike(f"%{search}%"),
                    ),
                )
            )
            total = (await self.db.execute(count_query)).scalar()
            
            query = (
                select(Product)
                .where(
                    Product.organization_id == org_id,
                    Product.is_deleted == False,
                    or_(
                        Product.name.ilike(f"%{search}%"),
                        Product.sku.ilike(f"%{search}%"),
                        Product.barcode.ilike(f"%{search}%"),
                    ),
                )
                .order_by(Product.name)
                .offset(skip)
                .limit(limit)
            )
            result = await self.db.execute(query)
            products = list(result.scalars().all())
        else:
            products = await self.repo.get_all(filters=filters, skip=skip, limit=limit)
            total = await self.repo.count(filters=filters)

        return products, total

    async def delete_product(self, product_id: UUID, org_id: UUID, user: User, request: Optional[Request] = None) -> bool:
        """Soft delete a product."""
        product = await self.repo.get_by_id(product_id)
        if not product or product.organization_id != org_id:
            raise NotFoundException("Product", product_id)
            
        old_val = self._serialize_product(product)
        success = await self.repo.soft_delete(product_id)
        
        if success:
            await self.audit.log(
                action=AuditAction.PRODUCT_DELETED,
                user=user,
                organization_id=org_id,
                entity_type="Product",
                entity_id=product.id,
                old_value=old_val,
                request=request,
            )
            
        return success

    async def get_low_stock_products(self, org_id: UUID, store_id: Optional[UUID] = None) -> List[dict]:
        """Get products below their low stock threshold for a store (or all stores)."""
        query = (
            select(Product, Inventory)
            .join(Inventory, Inventory.product_id == Product.id)
            .where(
                Product.organization_id == org_id,
                Product.is_deleted == False,
                Inventory.quantity <= Product.low_stock_threshold,
            )
        )
        if store_id:
            query = query.where(Inventory.store_id == store_id)
            
        query = query.order_by(Inventory.quantity)

        result = await self.db.execute(query)
        items = []
        for product, inv in result.all():
            items.append({
                "product": product,
                "current_stock": inv.quantity,
                "threshold": product.low_stock_threshold,
            })
        return items

    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

    async def upload_product_image(self, product_id: UUID, image: UploadFile, org_id: UUID) -> Product:
        """Upload and save product image locally."""
        product = await self.repo.get_by_id(product_id)
        if not product or product.organization_id != org_id:
            raise NotFoundException("Product", product_id)

        # Validate file type
        if image.content_type not in self.ALLOWED_IMAGE_TYPES:
            from app.core.exceptions import ValidationException
            raise ValidationException(
                f"Invalid file type '{image.content_type}'. "
                f"Allowed: {', '.join(self.ALLOWED_IMAGE_TYPES)}"
            )

        # Validate file size
        contents = await image.read()
        if len(contents) > self.MAX_IMAGE_SIZE:
            from app.core.exceptions import ValidationException
            raise ValidationException(
                f"File too large ({len(contents)} bytes). Maximum: {self.MAX_IMAGE_SIZE} bytes"
            )
        await image.seek(0)  # reset for saving

        # Ensure sub-directory exists
        product_dir = os.path.join(settings.UPLOAD_DIR, "products")
        if not os.path.exists(product_dir):
            os.makedirs(product_dir, exist_ok=True)

        # Generate unique filename with sanitized extension
        import re
        safe_ext = os.path.splitext(image.filename or ".jpg")[1].lower()
        if safe_ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            safe_ext = ".jpg"
        
        filename = f"product_{str(product.id)}_{uuid.uuid4().hex[:8]}{safe_ext}"
        file_path = os.path.join(product_dir, filename)

        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # Update database with relative path
        # Note: We use forward slashes for the URL
        image_url = f"/uploads/products/{filename}"
        await self.repo.update(product_id, {"image_url": image_url})
        
        return product
