"""Hospital-specific lab test pricing. Tenant-scoped."""

from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class HospitalLabTest(MultiTenantModel, Base):
    """Hospital–lab test link with agreed amount. Table: hospital_lab_test."""

    __tablename__ = "hospital_lab_test"

    hospital_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("hospital.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lab_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("lab.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    effective_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    hospital = relationship("Hospital", back_populates="hospital_lab_tests")
    lab = relationship("Lab", back_populates="hospital_prices")
