import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes.charts  import router as charts_router
from app.routes.exports import router as exports_router

load_dotenv()

app = FastAPI(
    title="Inventory MS — Python Microservice",
    description="Chart data and CSV export endpoints",
    version="1.0.0",
)

# Allow React frontend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Register routers — all endpoints live under /api
app.include_router(charts_router,  prefix="/api")
app.include_router(exports_router, prefix="/api")


@app.get("/health", tags=["Health"])
def health():
    return {"status": "OK", "service": "Python Microservice"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)