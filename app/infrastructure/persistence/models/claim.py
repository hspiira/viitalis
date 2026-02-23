"""Claim ORM model. Tenant-scoped."""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class Claim(MultiTenantModel, Base):
    __tablename__ = "claim"

    member_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("member.id", ondelete="CASCADE"), nullable=False, index=True
    )
    dependant_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("member_dependant.id", ondelete="SET NULL"), nullable=True, index=True
    )
    hospital_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("hospital.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doctor_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("doctor.id", ondelete="SET NULL"), nullable=True, index=True
    )
    service_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_amount: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    invoice_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    approval_comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    billing_session_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("billing_session.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    details = relationship(
        "ClaimDetail", back_populates="claim", cascade="all, delete-orphan"
    )
    billing_session = relationship(
        "BillingSession", back_populates="claims", foreign_keys=[billing_session_id]
    )
