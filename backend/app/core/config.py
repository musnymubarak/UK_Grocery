"""
Application configuration loaded from environment variables.
"""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment."""

    # App
    APP_NAME: str = "RetailPOS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost,http://localhost:5173"
    UPLOAD_DIR: str = "uploads"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://pos_user:pos_password@localhost:5432/pos_db"
    DATABASE_URL_SYNC: str = "postgresql://pos_user:pos_password@localhost:5432/pos_db"

    # JWT
    JWT_SECRET_KEY: str = "change-this-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        case_sensitive = True
        extra = "ignore"
        # Look for .env in current dir, project root (if in backend/), or app parent
        env_file = (".env", "../.env", "../../.env")


settings = Settings()
