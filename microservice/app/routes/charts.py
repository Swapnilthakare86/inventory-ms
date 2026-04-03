from fastapi import APIRouter, HTTPException
from app.services import chart_service

router = APIRouter(prefix="/charts", tags=["Charts"])


@router.get("/orders-per-day")
def orders_per_day():
    try:
        return chart_service.get_orders_per_day()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stock-by-category")
def stock_by_category():
    try:
        return chart_service.get_stock_by_category()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-products")
def top_products():
    try:
        return chart_service.get_top_products()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order-status")
def order_status():
    try:
        return chart_service.get_order_status_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))