"""SchemePlan link ORM model. Links scheme to plan. Tenant-scoped."""

from sqlalchemy import ForeignKey, String
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

    scheme = relationship("Scheme", back_populates="scheme_plans")
    plan = relationship("Plan", back_populates="scheme_plans")
