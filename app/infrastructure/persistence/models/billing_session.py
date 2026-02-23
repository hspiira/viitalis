"""Billing session ORM model. Tenant-scoped."""

from datetime import date

from sqlalchemy import Date, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class BillingSession(MultiTenantModel, Base):
    """Billing session. Table: billing_session. Status: open, closed, disabled."""

    __tablename__ = "billing_session"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    from_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    to_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_claims: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_amount: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    claims = relationship(
        "Claim",
        back_populates="billing_session",
        foreign_keys="Claim.billing_session_id",
    )
