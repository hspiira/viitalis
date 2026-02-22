"""SchemePlan link ORM model. Links scheme to plan with optional limit/dates. Tenant-scoped."""

from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class SchemePlan(MultiTenantModel, Base):
    """Scheme–Plan link. Table: scheme_plan. All queries must filter by tenant_id."""

    __tablename__ = "scheme_plan"

    scheme_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("scheme.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("plan.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    limit_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    begin_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    scheme = relationship("Scheme", back_populates="scheme_plans")
    plan = relationship("Plan", back_populates="scheme_plans")
