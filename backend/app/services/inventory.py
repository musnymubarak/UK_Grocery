"""
Inventory service — stock management, adjustments, and transfers.
"""
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import Inventory
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.core.exceptions import (
    NotFoundException,
    InsufficientStockException,
    ValidationException,
)
from app.schemas.inventory import StockAdjustment, StockTransfer, PurchaseEntry
from fastapi import Request
from app.models.user import User
from app.services.audit import AuditService
from app.constants.audit_actions import AuditAction
from app.core.cache import CacheService

class InventoryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)

    async def get_or_create_inventory(self, product_id: UUID, store_id: UUID) -> Inventory:
        """Get inventory record or create with zero quantity."""
        result = await self.db.execute(
            select(Inventory).where(
                Inventory.product_id == product_id,
                Inventory.store_id == store_id,
            )
        )
        inv = result.scalar_one_or_none()
        if not inv:
            inv = Inventory(product_id=product_id, store_id=store_id, quantity=0, reserved_quantity=0)
            self.db.add(inv)
            await self.db.flush()
            await self.db.refresh(inv)
        return inv

    async def get_store_inventory(
        self,
        store_id: UUID,
        org_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[dict]:
        """Get all inventory for a store with product details."""
        query = (
            select(Inventory, Product)
            .join(Product, Product.id == Inventory.product_id)
            .where(
                Inventory.store_id == store_id,
                Product.organization_id == org_id,
                Product.is_deleted == False,
            )
            .offset(skip)
            .limit(limit)
            .order_by(Product.name)
        )
        result = await self.db.execute(query)
        items = []
        for inv, product in result.all():
            items.append({
                "id": inv.id,
                "product_id": product.id,
                "store_id": inv.store_id,
                "quantity": inv.quantity,
                "reserved_quantity": inv.reserved_quantity,
                "available_quantity": inv.available_quantity,
                "product_name": product.name,
                "product_sku": product.sku,
                "image_url": product.image_url,
                "created_at": inv.created_at,
            })
        return items

    async def adjust_stock(self, data: StockAdjustment, user: User, org_id: UUID, request: Optional[Request] = None) -> Inventory:
        """Adjust stock quantity (positive or negative)."""
        inv = await self.get_or_create_inventory(data.product_id, data.store_id)

        new_quantity = inv.quantity + data.quantity
        if (new_quantity - inv.reserved_quantity) < 0:
            raise InsufficientStockException(
                product_name=str(data.product_id),
                available=inv.available_quantity,
                requested=abs(data.quantity),
            )

        inv.quantity = new_quantity
        await self.db.flush()

        # Record movement
        movement = StockMovement(
            product_id=data.product_id,
            store_id=data.store_id,
            quantity=data.quantity,
            movement_type="adjustment",
            reference=data.reason,
            notes=data.notes,
            performed_by=user.id,
        )
        self.db.add(movement)
        await self.db.flush()

        # Audit log
        await self.audit.log(
            action=AuditAction.STOCK_ADJUSTED,
            user=user,
            organization_id=org_id,
            store_id=data.store_id,
            entity_type="Inventory",
            entity_id=inv.id,
            old_value={"quantity": inv.quantity - data.quantity, "reserved_quantity": inv.reserved_quantity},
            new_value={"quantity": inv.quantity, "reserved_quantity": inv.reserved_quantity},
            notes=data.reason,
            request=request,
        )

        # Invalidate storefront cache
        await CacheService.invalidate_pattern("storefront:*")

        return inv

    async def transfer_stock(self, data: StockTransfer, user: User, org_id: UUID, request: Optional[Request] = None) -> dict:
        """Transfer stock between stores."""
        if data.from_store_id == data.to_store_id:
            raise ValidationException("Cannot transfer to the same store")

        # Deduct from source
        source_inv = await self.get_or_create_inventory(data.product_id, data.from_store_id)
        if source_inv.available_quantity < data.quantity:
            raise InsufficientStockException(
                product_name=str(data.product_id),
                available=source_inv.available_quantity,
                requested=data.quantity,
            )

        source_inv.quantity -= data.quantity

        # Add to destination
        dest_inv = await self.get_or_create_inventory(data.product_id, data.to_store_id)
        dest_inv.quantity += data.quantity

        await self.db.flush()

        # Record movements
        out_movement = StockMovement(
            product_id=data.product_id,
            store_id=data.from_store_id,
            from_store_id=data.from_store_id,
            quantity=-data.quantity,
            movement_type="transfer_out",
            notes=data.notes,
            performed_by=user.id,
        )
        in_movement = StockMovement(
            product_id=data.product_id,
            store_id=data.to_store_id,
            from_store_id=data.from_store_id,
            quantity=data.quantity,
            movement_type="transfer_in",
            notes=data.notes,
            performed_by=user.id,
        )
        self.db.add(out_movement)
        self.db.add(in_movement)
        await self.db.flush()

        # Audit log
        await self.audit.log(
            action=AuditAction.STOCK_TRANSFERRED,
            user=user,
            organization_id=org_id,
            store_id=data.from_store_id,
            entity_type="Inventory",
            entity_id=source_inv.id,
            old_value={"quantity": source_inv.quantity + data.quantity},
            new_value={"quantity": source_inv.quantity},
            notes=f"Transferred {data.quantity} to store {data.to_store_id}",
            request=request,
        )

        # Invalidate storefront cache
        await CacheService.invalidate_pattern("storefront:*")

        return {
            "from_store": {"store_id": data.from_store_id, "new_quantity": source_inv.quantity},
            "to_store": {"store_id": data.to_store_id, "new_quantity": dest_inv.quantity},
        }

    async def add_purchase(self, data: PurchaseEntry, user: User, org_id: UUID, request: Optional[Request] = None) -> Inventory:
        """Record a purchase that adds stock."""
        inv = await self.get_or_create_inventory(data.product_id, data.store_id)
        
        old_qty = inv.quantity
        inv.quantity += data.quantity
        await self.db.flush()

        movement = StockMovement(
            product_id=data.product_id,
            store_id=data.store_id,
            quantity=data.quantity,
            movement_type="purchase",
            reference=data.reference,
            notes=data.notes,
            performed_by=user.id,
        )
        self.db.add(movement)
        await self.db.flush()

        await self.audit.log(
            action=AuditAction.STOCK_ADJUSTED,
            user=user,
            organization_id=org_id,
            store_id=data.store_id,
            entity_type="Inventory",
            entity_id=inv.id,
            old_value={"quantity": old_qty, "reserved_quantity": inv.reserved_quantity},
            new_value={"quantity": inv.quantity, "reserved_quantity": inv.reserved_quantity},
            notes=f"Purchase entry. {data.notes or ''}",
            request=request,
        )

        # Invalidate storefront cache
        await CacheService.invalidate_pattern("storefront:*")

        return inv

    async def reserve_for_order(
        self,
        product_id: UUID,
        store_id: UUID,
        quantity: int,
    ) -> None:
        """Soft-reserve stock for a new order. Uses FOR UPDATE to prevent race conditions."""
        query = (
            select(Inventory)
            .where(Inventory.product_id == product_id, Inventory.store_id == store_id)
            .with_for_update()
        )
        result = await self.db.execute(query)
        inv = result.scalar_one_or_none()

        if not inv:
            # Create if missing (rare edge case — admin should pre-seed inventory)
            inv = Inventory(product_id=product_id, store_id=store_id, quantity=0, reserved_quantity=0)
            self.db.add(inv)
            await self.db.flush()
            # Re-lock the new row
            result = await self.db.execute(
                select(Inventory)
                .where(Inventory.id == inv.id)
                .with_for_update()
            )
            inv = result.scalar_one()

        if inv.available_quantity < quantity:
            raise InsufficientStockException(
                product_name=str(product_id),
                available=inv.available_quantity,
                requested=quantity,
            )
        inv.reserved_quantity += quantity
        await self.db.flush()

    async def release_reservation(
        self,
        product_id: UUID,
        store_id: UUID,
        quantity: int,
    ) -> None:
        """Release soft-reserved stock back to available."""
        inv = await self.get_or_create_inventory(product_id, store_id)
        inv.reserved_quantity = max(0, inv.reserved_quantity - quantity)
        await self.db.flush()

    async def deduct_for_order(
        self,
        product_id: UUID,
        store_id: UUID,
        quantity: int,
        order_reference: str,
        user_id: UUID,
    ) -> None:
        """Deduct stock for an order being packed. Uses SELECT FOR UPDATE."""
        query = (
            select(Inventory)
            .where(Inventory.product_id == product_id, Inventory.store_id == store_id)
            .with_for_update()
        )
        result = await self.db.execute(query)
        inv = result.scalar_one_or_none()
        
        if not inv:
            raise ValidationException("Inventory record not found")

        # It's already reserved, so we reduce quantity AND reserved_quantity
        if inv.quantity < quantity:
            raise InsufficientStockException(
                product_name=str(product_id),
                available=inv.quantity,
                requested=quantity,
            )

        inv.quantity -= quantity
        inv.reserved_quantity = max(0, inv.reserved_quantity - quantity)
        await self.db.flush()

        movement = StockMovement(
            product_id=product_id,
            store_id=store_id,
            quantity=-quantity,
            movement_type="order_packed",
            reference=order_reference,
            performed_by=user_id,
        )
        self.db.add(movement)
        await self.db.flush()

        # Invalidate storefront cache
        await CacheService.invalidate_pattern("storefront:*")

    async def restore_for_cancelled_after_pack(
        self,
        product_id: UUID,
        store_id: UUID,
        quantity: int,
        order_reference: str,
        user_id: UUID,
    ) -> None:
        """Restore stock if order is cancelled after being packed."""
        inv = await self.get_or_create_inventory(product_id, store_id)
        inv.quantity += quantity
        await self.db.flush()

        movement = StockMovement(
            product_id=product_id,
            store_id=store_id,
            quantity=quantity,
            movement_type="order_cancelled",
            reference=order_reference,
            performed_by=user_id,
        )
        self.db.add(movement)
        await self.db.flush()

        # Invalidate storefront cache
        await CacheService.invalidate_pattern("storefront:*")

    async def get_movements(
        self,
        store_id: UUID,
        product_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[StockMovement]:
        """Get stock movement history."""
        query = (
            select(StockMovement)
            .where(StockMovement.store_id == store_id)
        )
        if product_id:
            query = query.where(StockMovement.product_id == product_id)

        query = query.order_by(StockMovement.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
