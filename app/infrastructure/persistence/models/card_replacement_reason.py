"""Card replacement reason reference. Tenant-scoped."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class CardReplacementReason(MultiTenantModel, Base):
    """Reason for card replacement. Table: card_replacement_reason."""

    __tablename__ = "card_replacement_reason"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
