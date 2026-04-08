"""
Sync engine processor — handles bulk sync from offline clients.
Supports idempotent processing, conflict resolution, and retry tracking.
"""
import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.sync_log import SyncLog
from app.schemas.sync import SyncAction, BulkSyncRequest, SyncActionResult
from app.schemas.sale import SaleCreate, SaleItemCreate
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.inventory import StockAdjustment, PurchaseEntry
from app.services.sale import SaleService
from app.services.product import ProductService
from app.services.inventory import InventoryService

logger = logging.getLogger(__name__)


class SyncProcessor:
    """Processes offline sync actions from clients."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.sale_service = SaleService(db)
        self.product_service = ProductService(db)
        self.inventory_service = InventoryService(db)

    async def process_bulk(
        self,
        request: BulkSyncRequest,
        user_id: UUID,
        org_id: UUID,
    ) -> dict:
        """Process a batch of offline actions."""
        results = []
        completed = 0
        failed = 0
        conflicts = 0

        for action in request.actions:
            result = await self._process_action(
                action=action,
                store_id=request.store_id,
                user_id=user_id,
                org_id=org_id,
            )
            results.append(result)

            if result.status == "completed":
                completed += 1
            elif result.status == "conflict":
                conflicts += 1
            else:
                failed += 1

        return {
            "total": len(request.actions),
            "completed": completed,
            "failed": failed,
            "conflicts": conflicts,
            "results": results,
        }

    async def _process_action(
        self,
        action: SyncAction,
        store_id: UUID,
        user_id: UUID,
        org_id: UUID,
    ) -> SyncActionResult:
        """Process a single sync action with idempotency check."""

        # Idempotency: check if already processed
        existing = await self.db.execute(
            select(SyncLog).where(
                SyncLog.client_id == action.id,
                SyncLog.status == "completed",
            )
        )
        if existing.scalar_one_or_none():
            return SyncActionResult(
                client_id=action.id,
                status="completed",
                error="Already processed (idempotent skip)",
            )

        # Create sync log entry
        sync_log = SyncLog(
            client_id=action.id,
            action_type=action.action_type,
            entity_type=action.entity_type,
            client_entity_id=action.client_entity_id,
            payload=action.payload,
            status="processing",
            organization_id=org_id,
            store_id=store_id,
            user_id=user_id,
        )
        self.db.add(sync_log)
        await self.db.flush()

        try:
            server_entity_id = await self._execute_action(
                action=action,
                store_id=store_id,
                user_id=user_id,
                org_id=org_id,
            )

            sync_log.status = "completed"
            sync_log.entity_id = server_entity_id
            await self.db.flush()

            return SyncActionResult(
                client_id=action.id,
                status="completed",
                server_entity_id=server_entity_id,
            )

        except Exception as e:
            logger.error(f"Sync action {action.id} failed: {str(e)}")
            sync_log.status = "failed"
            sync_log.error_message = str(e)
            sync_log.retries += 1
            await self.db.flush()

            return SyncActionResult(
                client_id=action.id,
                status="failed",
                error=str(e),
            )

    async def _execute_action(
        self,
        action: SyncAction,
        store_id: UUID,
        user_id: UUID,
        org_id: UUID,
    ) -> Optional[UUID]:
        """Execute the actual business operation for a sync action."""

        if action.action_type == "create_sale":
            items = [
                SaleItemCreate(**item) for item in action.payload.get("items", [])
            ]
            sale_data = SaleCreate(
                store_id=store_id,
                items=items,
                discount_amount=action.payload.get("discount_amount", 0),
                payment_method=action.payload.get("payment_method", "cash"),
                notes=action.payload.get("notes"),
                client_id=action.id,
            )
            sale = await self.sale_service.create_sale(sale_data, user_id, org_id)
            return sale.id

        elif action.action_type == "create_product":
            product_data = ProductCreate(**action.payload)
            product = await self.product_service.create_product(product_data, org_id)
            return product.id

        elif action.action_type == "update_product":
            product_id = UUID(action.payload.pop("product_id"))
            update_data = ProductUpdate(**action.payload)
            product = await self.product_service.update_product(
                product_id, update_data, org_id
            )
            return product.id

        elif action.action_type == "adjust_stock":
            adj_data = StockAdjustment(**action.payload)
            inv = await self.inventory_service.adjust_stock(adj_data, user_id)
            return inv.id

        elif action.action_type == "add_purchase":
            purchase_data = PurchaseEntry(**action.payload)
            inv = await self.inventory_service.add_purchase(purchase_data, user_id)
            return inv.id

        else:
            raise ValueError(f"Unknown action type: {action.action_type}")
