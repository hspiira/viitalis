"""AppUserDetail ORM model. One-to-one with AppUser."""

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import CuidMixin, TimestampMixin


class AppUserDetail(CuidMixin, TimestampMixin, Base):
    """User profile details. Table: app_user_detail. One-to-one with app_user."""

    __tablename__ = "app_user_detail"

    user_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("app_user.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
