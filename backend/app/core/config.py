from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DocFlow API"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./docflow.db"
    storage_root: Path = Path("../storage")
    max_upload_mb: int = 20
    allowed_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def uploads_dir(self) -> Path:
        return self.storage_root / "uploads"

    @property
    def exports_dir(self) -> Path:
        return self.storage_root / "exports"


@lru_cache
def get_settings() -> Settings:
    return Settings()

