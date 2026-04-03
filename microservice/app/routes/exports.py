from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services import export_service

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/orders")
def export_orders():
    try:
        df  = export_service.get_orders_dataframe()
        csv = export_service.dataframe_to_csv_bytes(df)
        return StreamingResponse(
            csv,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=orders.csv"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stock")
def export_stock():
    try:
        df  = export_service.get_stock_dataframe()
        csv = export_service.dataframe_to_csv_bytes(df)
        return StreamingResponse(
            csv,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=stock.csv"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))