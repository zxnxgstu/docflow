from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.documents import router
from app.core.config import get_settings
from app.db.session import Base, engine


settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.exports_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix=settings.api_prefix)


@app.get(f"{settings.api_prefix}/health", tags=["system"])
def health():
    return {"status": "healthy", "service": "docflow-api", "version": "0.2.0"}
