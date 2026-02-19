"""CompanyBranch ORM model. Tenant-scoped, linked to company."""

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class CompanyBranch(MultiTenantModel, Base):
    """Company branch. Table: company_branch. All queries must filter by tenant_id."""

    __tablename__ = "company_branch"

    company_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("company.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
