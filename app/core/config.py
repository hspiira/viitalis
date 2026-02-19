"""Application configuration (settings and environment).

Single source of truth. Uses pydantic-settings with .env support.
Supports both Oracle and PostgreSQL via DATABASE_URL.
"""

from functools import lru_cache

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment and .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_name: str = "hms-backend"
    app_version: str = "0.1.0"
    debug: bool = False

    # Database: "postgres" or "oracle"; DATABASE_URL must match (postgresql+asyncpg:// or oracle+oracledb://)
    database_backend: str = "postgres"
    database_url: SecretStr = SecretStr("")
    database_echo: bool = False

    # Security (set SECRET_KEY in production)
    secret_key: SecretStr = SecretStr("dev-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    # Tenant
    tenant_header_name: str = "X-Tenant-ID"
    create_tenant_secret: SecretStr | None = None

    # CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    @model_validator(mode="after")
    def validate_database(self) -> "Settings":
        """Validate DATABASE_URL format when backend is postgres or oracle and URL is set."""
        if self.database_backend not in ("postgres", "oracle"):
            return self
        url = self.database_url.get_secret_value()
        if not url or not url.strip():
            return self
        if self.database_backend == "postgres" and "postgresql" not in url:
            raise ValueError(
                "DATABASE_URL must be postgresql+asyncpg:// when DATABASE_BACKEND=postgres"
            )
        if self.database_backend == "oracle" and "oracle" not in url:
            raise ValueError(
                "DATABASE_URL must be oracle+oracledb:// when DATABASE_BACKEND=oracle"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
