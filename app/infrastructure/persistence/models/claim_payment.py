"""ClaimPayment ORM model. Tenant-scoped."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class ClaimPayment(MultiTenantModel, Base):
    __tablename__ = "claim_payment"

    claim_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("claim.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)

    claim = relationship("Claim", backref="payments")
