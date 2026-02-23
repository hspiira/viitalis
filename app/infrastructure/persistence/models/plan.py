"""Plan ORM model. Tenant-scoped."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class Plan(MultiTenantModel, Base):
    """Plan entity. Table: plan. All queries must filter by tenant_id."""

    __tablename__ = "plan"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), nullable=True)

    scheme_plans = relationship("SchemePlan", back_populates="plan", cascade="all, delete-orphan")
