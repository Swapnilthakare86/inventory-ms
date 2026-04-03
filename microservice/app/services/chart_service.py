import pandas as pd
from app.db.database import get_connection


def get_orders_per_day() -> list[dict]:
    db = get_connection()
    query = """
        SELECT
            DATE(order_date)    AS date,
            COUNT(*)            AS count,
            SUM(total_price)    AS revenue
        FROM orders
        WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(order_date)
        ORDER BY date
    """
    df = pd.read_sql(query, db)
    db.close()

    df["date"]    = df["date"].astype(str)
    df["revenue"] = df["revenue"].fillna(0).astype(float)
    return df.to_dict(orient="records")


def get_stock_by_category() -> list[dict]:
    db = get_connection()
    query = """
        SELECT
            c.name          AS category,
            SUM(p.stock)    AS total_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        GROUP BY c.name
    """
    df = pd.read_sql(query, db)
    db.close()

    df["total_stock"] = df["total_stock"].fillna(0).astype(int)
    return df.to_dict(orient="records")


def get_top_products(limit: int = 5) -> list[dict]:
    db = get_connection()
    query = f"""
        SELECT
            p.name,
            SUM(o.quantity) AS total_sold
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.status != 'cancelled'
        GROUP BY p.name
        ORDER BY total_sold DESC
        LIMIT {limit}
    """
    df = pd.read_sql(query, db)
    db.close()

    df["total_sold"] = df["total_sold"].fillna(0).astype(int)
    return df.to_dict(orient="records")


def get_order_status_summary() -> list[dict]:
    db = get_connection()
    query = """
        SELECT
            status,
            COUNT(*) AS count
        FROM orders
        GROUP BY status
    """
    df = pd.read_sql(query, db)
    db.close()

    df["count"] = df["count"].astype(int)
    return df.to_dict(orient="records")