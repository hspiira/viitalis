"""Benefit catalog ORM model. Tenant-scoped."""

from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class Benefit(MultiTenantModel, Base):
    """Benefit definition. Table: benefit."""

    __tablename__ = "benefit"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    service_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    in_or_out_patient: Mapped[str | None] = mapped_column(String(32), nullable=True)
    limit_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    scheme_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    covered: Mapped[str] = mapped_column(String(10), nullable=False, default="yes")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    scheme_benefits = relationship(
        "SchemeBenefit", back_populates="benefit", cascade="all, delete-orphan"
    )
    linkages = relationship(
        "BenefitLinkage", back_populates="benefit", cascade="all, delete-orphan"
    )
