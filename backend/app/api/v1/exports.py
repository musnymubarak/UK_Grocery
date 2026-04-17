"""Export API — CSV downloads for sales and inventory reports."""
import csv
import io
from uuid import UUID
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import require_role, get_org_context
from app.models.user import User
from app.services.report import ReportService

router = APIRouter(prefix="/exports", tags=["Exports"])

@router.get("/sales")
async def export_sales_csv(
    store_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Export sales summary as CSV."""
    service = ReportService(db)
    data = await service.get_sales_summary(org_id, store_id, date_from, date_to)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Total Sales", data.get("total_sales", 0)])
    writer.writerow(["Total Revenue", data.get("total_revenue", 0)])
    writer.writerow(["Total Discount", data.get("total_discount", 0)])
    writer.writerow(["Total Items Sold", data.get("total_items_sold", 0)])
    writer.writerow(["Refund Count", data.get("refund_count", 0)])
    writer.writerow(["Refund Amount", data.get("refund_amount", 0)])
    writer.writerow(["Average Order Value", data.get("average_order_value", 0)])
    output.seek(0)

    # Note: StringIO.getvalue() returns the entire content. StreamingResponse can also take an iterator.
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sales_report_{datetime.now().strftime('%Y%m%d')}.csv"},
    )
