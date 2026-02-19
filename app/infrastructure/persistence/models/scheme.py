"""Scheme ORM model. Tenant-scoped, linked to company."""

from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class Scheme(MultiTenantModel, Base):
    """Scheme entity. Table: scheme. All queries must filter by tenant_id."""

    __tablename__ = "scheme"

    company_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("company.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    limit_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    begin_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    termination_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    scheme_plans = relationship("SchemePlan", back_populates="scheme", cascade="all, delete-orphan")
