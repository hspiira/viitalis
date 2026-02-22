"""Doctor ORM model. Tenant-scoped, linked to hospital. Full parity with Doctors.csv."""

from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class Doctor(MultiTenantModel, Base):
    __tablename__ = "doctor"

    hospital_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("hospital.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reference: Mapped[str | None] = mapped_column(String(64), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone_home: Mapped[str | None] = mapped_column(String(64), nullable=True)
    phone_mobile: Mapped[str | None] = mapped_column(String(64), nullable=True)
    licence_no: Mapped[str | None] = mapped_column(String(64), nullable=True)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    doctor_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(32), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    service_charges: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    channeling_charges: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    referring_charges: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    hospital = relationship("Hospital", back_populates="doctors")
