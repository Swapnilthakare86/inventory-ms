import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

_engine = None

def get_engine():
    global _engine
    if _engine is None:
        url = "mysql+pymysql://{user}:{password}@{host}/{db}".format(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            db=os.getenv("DB_NAME"),
        )
        _engine = create_engine(url, pool_size=5, max_overflow=10, pool_recycle=3600)
    return _engine
