"""Persistence: async engine, session factory, Base.

Supports PostgreSQL (asyncpg) and Oracle (oracledb). Engine and session
created lazily on first use. Postgres: optional SET LOCAL app.current_tenant_id
for RLS. Oracle: tenant isolation via repository WHERE tenant_id = :id.
"""

import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings
from app.core.tenant_context import get_tenant_id as get_current_tenant_id
from app.core.tenant_validation import is_valid_tenant_id_format
from app.domain.exceptions import SqlNotConfiguredException

logger = logging.getLogger(__name__)

engine: Any = None
AsyncSessionLocal: async_sessionmaker[AsyncSession] | None = None


def _ensure_engine() -> None:
    """Create engine and AsyncSessionLocal on first use (postgres or oracle)."""
    global engine, AsyncSessionLocal
    if AsyncSessionLocal is not None:
        return
    settings = get_settings()
    if settings.database_backend not in ("postgres", "oracle"):
        return
    url = settings.database_url.get_secret_value().strip()
    if not url:
        return
    connect_args: dict[str, Any] = {}
    if settings.database_backend == "postgres":
        connect_args["command_timeout"] = 60
    engine = create_async_engine(
        url,
        echo=settings.database_echo,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600,
        connect_args=connect_args,
    )
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""


def _quote_set_value(value: str) -> str:
    """Escape for PostgreSQL SET LOCAL (single-quoted literal)."""
    return value.replace("'", "''")


async def _set_tenant_context(session: AsyncSession) -> None:
    """Set app.current_tenant_id for Postgres RLS. No-op for Oracle."""
    settings = get_settings()
    if settings.database_backend != "postgres":
        return
    tenant_id = get_current_tenant_id()
    if not tenant_id:
        return
    if not is_valid_tenant_id_format(tenant_id):
        logger.warning(
            "Skipping SET LOCAL app.current_tenant_id: tenant_id failed format validation"
        )
        return
    safe = _quote_set_value(tenant_id)
    await session.execute(text(f"SET LOCAL app.current_tenant_id = '{safe}'"))


async def get_db():
    """Database session for read operations. Yields session; does not commit."""
    _ensure_engine()
    if AsyncSessionLocal is None:
        raise SqlNotConfiguredException(
            "Set DATABASE_BACKEND=postgres or oracle and DATABASE_URL, then run alembic upgrade head"
        )
    async with AsyncSessionLocal() as session:
        await _set_tenant_context(session)
        yield session


async def get_db_transactional():
    """Database session for write operations. Transaction commits on success."""
    _ensure_engine()
    if AsyncSessionLocal is None:
        raise SqlNotConfiguredException(
            "Set DATABASE_BACKEND=postgres or oracle and DATABASE_URL, then run alembic upgrade head"
        )
    async with AsyncSessionLocal() as session:
        async with session.begin():
            await _set_tenant_context(session)
            yield session
