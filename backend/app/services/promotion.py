"""
Promotion service — evaluate cart items against active promotions.
"""
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Dict, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

from app.models.promotion import Promotion

class PromotionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active_promotions(self, org_id: UUID, store_id: Optional[UUID] = None) -> List[Promotion]:
        """List currently active promotions for a store."""
        now = datetime.now(timezone.utc)
        query = select(Promotion).where(
            and_(
                Promotion.organization_id == org_id,
                or_(Promotion.store_id == None, Promotion.store_id == store_id),
                Promotion.is_active == True,
                or_(Promotion.starts_at == None, Promotion.starts_at <= now),
                or_(Promotion.ends_at == None, Promotion.ends_at >= now)
            )
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def evaluate_cart(
        self, 
        items: List[Dict], # [{"product_id": UUID, "quantity": int, "price": Decimal}]
        org_id: UUID, 
        store_id: Optional[UUID] = None
    ) -> List[Dict]:
        """
        Evaluate cart items and return a list of applied promotions and their discount amounts.
        Returns: List of {"promotion_id": UUID, "name": str, "discount_amount": Decimal}
        """
        active_promos = await self.get_active_promotions(org_id, store_id)
        applied_discounts = []
        
        # Build cart lookup
        cart = {item["product_id"]: item for item in items}
        
        for promo in active_promos:
            discount = Decimal("0.00")
            
            if promo.promotion_type == "buy_x_get_y":
                # Config: {"buy_product_id": UUID, "buy_qty": int, "get_qty": int, "discount_pct": float}
                buy_pid = UUID(promo.config["buy_product_id"])
                if buy_pid in cart:
                    buy_qty = int(promo.config["buy_qty"])
                    get_qty = int(promo.config["get_qty"])
                    discount_pct = Decimal(str(promo.config["discount_pct"])) / 100
                    
                    times_applied = cart[buy_pid]["quantity"] // buy_qty
                    if times_applied > 0:
                        # For simplicity, we assume the discount applies to the same product or we just 
                        # subtract from the subtotal based on the price of the 'buy' item.
                        # Real-world logic might be more complex (cheapest item free, etc.)
                        discount = (Decimal(str(cart[buy_pid]["price"])) * get_qty * times_applied) * discount_pct
            
            elif promo.promotion_type == "quantity_discount":
                # Config: {"product_id": UUID, "min_qty": int, "discount_pct": float}
                pid = UUID(promo.config["product_id"])
                if pid in cart:
                    min_qty = int(promo.config["min_qty"])
                    if cart[pid]["quantity"] >= min_qty:
                        discount_pct = Decimal(str(promo.config["discount_pct"])) / 100
                        discount = (Decimal(str(cart[pid]["price"])) * cart[pid]["quantity"]) * discount_pct

            if discount > 0:
                applied_discounts.append({
                    "promotion_id": promo.id,
                    "name": promo.name,
                    "discount_amount": discount
                })
                
        return applied_discounts
