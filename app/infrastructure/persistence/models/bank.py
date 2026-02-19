"""Bank ORM model. Tenant-scoped."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class Bank(MultiTenantModel, Base):
    """Bank. Table: bank."""

    __tablename__ = "bank"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    branches = relationship(
        "BankBranch", back_populates="bank", cascade="all, delete-orphan"
    )
