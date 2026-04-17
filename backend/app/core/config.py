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
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"
    UPLOAD_DIR: str = "uploads"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://pos_user:pos_password@localhost:5432/pos_db"
    DATABASE_URL_SYNC: str = "postgresql://pos_user:pos_password@localhost:5432/pos_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "change-this-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        case_sensitive = True
        extra = "ignore"
        # Look for .env in current dir, project root (if in backend/), or app parent
        env_file = (".env", "../.env", "../../.env")

    from pydantic import model_validator

    @model_validator(mode="after")
    def validate_production_settings(self):
        """Refuse to start with default JWT secret in production."""
        dangerous_secrets = {
            "change-this-secret-key",
            "your-super-secret-key-change-in-production",
        }
        if not self.DEBUG and self.JWT_SECRET_KEY in dangerous_secrets:
            raise ValueError(
                "SECURITY: Default JWT secret detected in non-DEBUG mode. "
                "Generate a real secret with: openssl rand -hex 32"
            )
        return self


settings = Settings()
