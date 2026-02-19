"""Scheme–benefit link ORM model. Tenant-scoped."""

from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class SchemeBenefit(MultiTenantModel, Base):
    """Scheme–benefit link. Table: scheme_benefit."""

    __tablename__ = "scheme_benefit"

    scheme_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("scheme.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    benefit_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("benefit.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    limit_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    copayment_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    waiting_period_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    termination_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    scheme = relationship("Scheme", back_populates="scheme_benefits")
    benefit = relationship("Benefit", back_populates="scheme_benefits")
