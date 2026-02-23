"""Reimbursement ORM model. Tenant-scoped."""

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class Reimbursement(MultiTenantModel, Base):
    __tablename__ = "reimbursement"

    claim_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("claim.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")

    claim = relationship("Claim", backref="reimbursements")
