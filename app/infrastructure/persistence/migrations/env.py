"""Alembic environment. Uses app config and Base.metadata for dialect-neutral migrations."""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

from app.core.config import get_settings
from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models import (  # noqa: F401 - register models
    AppUser,
    Claim,
    ClaimDetail,
    ClaimPayment,
    Company,
    CompanyBranch,
    Diagnosis,
    Doctor,
    Hospital,
    HospitalBranch,
    Lab,
    Medicine,
    Member,
    MemberDependant,
    Plan,
    Scheme,
    SchemePlan,
    ServiceMaintenance,
    Tenant,
)

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    """Database URL from settings. Use sync driver for migrations."""
    try:
        url = get_settings().database_url.get_secret_value().strip()
    except Exception:
        url = ""
    if not url:
        return config.get_main_option("sqlalchemy.url", "sqlite:///alembic.db")
    # Use sync driver for Alembic: asyncpg -> psycopg2 for Postgres
    if "postgresql+asyncpg" in url:
        url = url.replace("postgresql+asyncpg", "postgresql+psycopg2", 1)
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
