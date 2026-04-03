import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    """Establishes a connection to the MySQL database."""
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
        )
        if conn.is_connected():
            print(f"Successfully connected to the database: {os.getenv('DB_NAME')}")
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None