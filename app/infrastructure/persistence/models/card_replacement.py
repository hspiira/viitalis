"""Card replacement request. Tenant-scoped."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class CardReplacement(MultiTenantModel, Base):
    """Card replacement request. Table: card_replacement."""

    __tablename__ = "card_replacement"

    member_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("member.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    dependant_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("member_dependant.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reason_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("card_replacement_reason.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    old_card_no: Mapped[str | None] = mapped_column(String(64), nullable=True)
    new_card_no: Mapped[str | None] = mapped_column(String(64), nullable=True)
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="requested")
