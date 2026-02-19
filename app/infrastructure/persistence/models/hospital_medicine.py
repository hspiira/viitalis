"""Hospital-specific medicine pricing. Tenant-scoped."""

from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class HospitalMedicine(MultiTenantModel, Base):
    """Hospital–medicine link with agreed unit price. Table: hospital_medicine."""

    __tablename__ = "hospital_medicine"

    hospital_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("hospital.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    medicine_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("medicine.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    unit_price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    effective_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    hospital = relationship("Hospital", back_populates="hospital_medicines")
    medicine = relationship("Medicine", back_populates="hospital_prices")
