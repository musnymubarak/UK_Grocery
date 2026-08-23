"""
Application configuration loaded from environment variables.
"""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment."""

    # App
    APP_NAME: str = "Daily Grocer"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    # Separate from DEBUG on purpose: this server is publicly reachable at
    # api.dailygrocer.co.uk with a real cert, so /docs being tied to DEBUG meant
    # "convenient for local dev" and "world-readable API map" were the same
    # switch. This one only controls doc exposure; DEBUG still controls the
    # auto-create-tables dev convenience, untouched.
    ENABLE_API_DOCS: bool = False
    CORS_ORIGINS: str = "http://localhost,http://localhost:5173"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"
    UPLOAD_DIR: str = "uploads"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://pos_user:pos_password@localhost:5432/pos_db"
    DATABASE_URL_SYNC: str = "postgresql://pos_user:pos_password@localhost:5432/pos_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # External APIs
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    GOOGLE_MAPS_API_KEY: str = "YOUR_GOOGLE_MAPS_API_KEY_HERE"
    # Comma-separated audience allow-list: mobile web/server client, mobile iOS client,
    # mobile Android clients, storefront web client. Overridden by GOOGLE_CLIENT_ID in .env.
    GOOGLE_CLIENT_ID: str = (
        "721475838135-vuc68jpvf4b32qjfh19cv1hhsb22etbb.apps.googleusercontent.com,"
        "721475838135-a5s2f1abkej3b10e98dr8hq0tphncpsi.apps.googleusercontent.com,"
        "721475838135-adj4bfeehr5oap7m4bdfkolc8cqo4aqd.apps.googleusercontent.com,"
        "721475838135-i6sn44th7cdkt4db00igeseu4r4r89jd.apps.googleusercontent.com,"
        "831513497012-88u2bqs01njl5fv2f88t3q37n6e5t1fh.apps.googleusercontent.com"
    )
    FIREBASE_CREDENTIALS_PATH: str = "firebase-service-account.json"

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
        """Refuse to start with a weak JWT secret in production.

        HS256 (this app's JWT_ALGORITHM) is specified by RFC 7518 to need a
        signing key at least as long as its hash output — 256 bits, i.e. 32
        bytes — or forging a valid "logged in as anyone" token becomes a
        matter of guessing the secret, not breaking cryptography. The old
        check only rejected two specific placeholder strings by exact match;
        admin123, a single character, or anything else short still passed.
        Kept alongside the length/diversity checks below (not replaced by
        them) — the known placeholders are cheap to catch by name, and one of
        them ("your-super-secret-key-change-in-production", 44 chars) is
        actually long enough to slip past a length check alone.
        """
        dangerous_secrets = {
            "change-this-secret-key",
            "your-super-secret-key-change-in-production",
        }
        if not self.DEBUG:
            secret = self.JWT_SECRET_KEY
            if secret in dangerous_secrets:
                raise ValueError(
                    "SECURITY: Default JWT secret detected in non-DEBUG mode. "
                    "Generate a real secret with: openssl rand -hex 32"
                )
            if len(secret) < 32:
                raise ValueError(
                    "SECURITY: JWT_SECRET_KEY is too short for production "
                    f"({len(secret)} chars, need at least 32). "
                    "Generate a real secret with: openssl rand -hex 32"
                )
            if len(set(secret)) < 8:
                raise ValueError(
                    "SECURITY: JWT_SECRET_KEY doesn't look random enough for "
                    "production (too few distinct characters). "
                    "Generate a real secret with: openssl rand -hex 32"
                )
        return self


settings = Settings()
