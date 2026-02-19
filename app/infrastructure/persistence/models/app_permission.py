"""AppPermission ORM model. User per-module permissions."""

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin


class AppPermission(CuidMixin, TimestampMixin, Base):
    """User permission per module. Table: app_permission. Unique (user_id, module_id)."""

    __tablename__ = "app_permission"
    __table_args__ = (
        UniqueConstraint("user_id", "module_id", name="uq_app_permission_user_module"),
    )

    user_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("app_user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    module_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("app_module.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    can_view: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    can_create: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    can_edit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    can_delete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    can_approve: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    module = relationship("AppModule", back_populates="permissions")
