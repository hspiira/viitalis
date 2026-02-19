"""SQLAlchemy mixins for common model patterns (DRY).

Provides: CuidMixin, TenantMixin, TimestampMixin, SoftDeleteMixin,
and combined MultiTenantModel. Same pattern as new_timeline.
Dialect-neutral (Oracle and PostgreSQL).
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, declared_attr, mapped_column
from sqlalchemy.sql import func

from app.shared.utils.generators import generate_cuid


class CuidMixin:
    """Mixin for models using CUID as primary key."""

    @declared_attr
    def id(cls) -> Mapped[str]:
        return mapped_column(String(64), primary_key=True, default=generate_cuid)


class TenantMixin:
    """Mixin for multi-tenant models. tenant_id FK to tenant with CASCADE delete."""

    @declared_attr
    def tenant_id(cls) -> Mapped[str]:
        return mapped_column(
            String(64),
            ForeignKey("tenant.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )


class TimestampMixin:
    """created_at and updated_at (server defaults, timezone-aware)."""

    @declared_attr
    def created_at(cls) -> Mapped[datetime]:
        return mapped_column(
            DateTime(timezone=True), server_default=func.now(), nullable=False
        )

    @declared_attr
    def updated_at(cls) -> Mapped[datetime]:
        return mapped_column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        )


class SoftDeleteMixin:
    """Soft delete: deleted_at. Null means not deleted."""

    @declared_attr
    def deleted_at(cls) -> Mapped[datetime | None]:
        return mapped_column(DateTime(timezone=True), nullable=True, index=True)


class MultiTenantModel(CuidMixin, TenantMixin, TimestampMixin):
    """Combined: CUID + tenant_id + created_at/updated_at for tenant-scoped entities."""

    __abstract__ = True
