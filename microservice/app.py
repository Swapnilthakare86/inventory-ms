from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import mysql.connector
import pandas as pd
import io
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Inventory Analytics Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
    )


@app.get("/api/charts/orders-per-day")
def orders_per_day():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT DATE(order_date) AS date, COUNT(*) AS count, SUM(total_price) AS revenue
        FROM orders
        WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(order_date)
        ORDER BY date
    """)
    data = cursor.fetchall()
    cursor.close()
    db.close()

    for row in data:
        row["date"] = str(row["date"])
        row["revenue"] = float(row["revenue"] or 0)

    return data


@app.get("/api/charts/stock-by-category")
def stock_by_category():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.name AS category, SUM(p.stock) AS total_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        GROUP BY c.name
    """)
    data = cursor.fetchall()
    cursor.close()
    db.close()

    for row in data:
        row["total_stock"] = int(row["total_stock"] or 0)

    return data


@app.get("/api/charts/top-products")
def top_products():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.name, SUM(o.quantity) AS total_sold
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.status != 'cancelled'
        GROUP BY p.name
        ORDER BY total_sold DESC
        LIMIT 5
    """)
    data = cursor.fetchall()
    cursor.close()
    db.close()

    for row in data:
        row["total_sold"] = int(row["total_sold"] or 0)

    return data


@app.get("/api/charts/order-status")
def order_status():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT status, COUNT(*) AS count FROM orders GROUP BY status")
    data = cursor.fetchall()
    cursor.close()
    db.close()

    for row in data:
        row["count"] = int(row["count"])

    return data


@app.get("/api/export/orders")
def export_orders():
    db = get_db()
    df = pd.read_sql("""
        SELECT o.id, u.name AS customer, u.address, p.name AS product,
               c.name AS category, o.quantity, o.total_price, o.status, o.order_date
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN products p ON o.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY o.order_date DESC
    """, db)
    db.close()

    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders.csv"},
    )


@app.get("/api/export/stock")
def export_stock():
    db = get_db()
    df = pd.read_sql("""
        SELECT p.id, p.name, c.name AS category, s.name AS supplier,
               p.price, p.stock,
               CASE WHEN p.stock = 0 THEN 'Out of Stock'
                    WHEN p.stock <= 3 THEN 'Low Stock'
                    ELSE 'In Stock' END AS status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.stock ASC
    """, db)
    db.close()

    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=stock.csv"},
    )


@app.get("/health")
def health():
    return {"status": "OK", "service": "FastAPI Microservice"}
