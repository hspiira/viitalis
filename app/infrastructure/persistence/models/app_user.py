"""AppUser ORM model. Tenant-scoped. Unique (tenant_id, username)."""

from sqlalchemy import Boolean, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class AppUser(MultiTenantModel, Base):
    __tablename__ = "app_user"
    __table_args__ = (UniqueConstraint("tenant_id", "username", name="uq_app_user_tenant_username"),)

    username: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
