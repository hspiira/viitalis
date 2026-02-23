"""ClaimDetail ORM model. Tenant-scoped."""

from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class ClaimDetail(MultiTenantModel, Base):
    __tablename__ = "claim_detail"

    claim_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("claim.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fee_code: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")

    claim = relationship("Claim", back_populates="details")
