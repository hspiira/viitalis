"""AppModule ORM model. Global module definition (no tenant)."""

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin


class AppModule(CuidMixin, TimestampMixin, Base):
    """Application module. Table: app_module. Global lookup."""

    __tablename__ = "app_module"

    code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("app_module.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    module_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    permissions = relationship(
        "AppPermission", back_populates="module", cascade="all, delete-orphan"
    )
