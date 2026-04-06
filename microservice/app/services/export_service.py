import io
import pandas as pd
from sqlalchemy import text
from app.db.database import get_engine


def get_orders_dataframe() -> pd.DataFrame:
    engine = get_engine()
    query = text("""
        SELECT
            o.id,
            u.name          AS customer,
            u.address,
            p.name          AS product,
            c.name          AS category,
            o.quantity,
            o.total_price,
            o.status,
            o.order_date
        FROM orders o
        JOIN users u     ON o.user_id    = u.id
        JOIN products p  ON o.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY o.order_date DESC
    """)
    with engine.connect() as conn:
        return pd.read_sql(query, conn)


def get_stock_dataframe() -> pd.DataFrame:
    engine = get_engine()
    query = text("""
        SELECT
            p.id,
            p.name,
            c.name  AS category,
            s.name  AS supplier,
            p.price,
            p.stock,
            CASE
                WHEN p.stock = 0    THEN 'Out of Stock'
                WHEN p.stock <= 5   THEN 'Low Stock'
                ELSE                     'In Stock'
            END AS status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers  s ON p.supplier_id  = s.id
        ORDER BY p.stock ASC
    """)
    with engine.connect() as conn:
        return pd.read_sql(query, conn)


def dataframe_to_csv_bytes(df: pd.DataFrame) -> io.BytesIO:
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    return io.BytesIO(buffer.getvalue().encode())
