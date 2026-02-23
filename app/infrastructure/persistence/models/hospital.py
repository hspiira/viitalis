"""Hospital ORM model. Tenant-scoped. Full parity with Hospitals.csv."""

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class Hospital(MultiTenantModel, Base):
    __tablename__ = "hospital"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reference: Mapped[str | None] = mapped_column(String(64), nullable=True)
    contact_person: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    district_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    outpatient_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    inpatient_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    out_or_in_patient: Mapped[str | None] = mapped_column(String(32), nullable=True)  # BOTH, OUT, IN
    dental: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    branches = relationship("HospitalBranch", back_populates="hospital", cascade="all, delete-orphan")
    doctors = relationship("Doctor", back_populates="hospital", cascade="all, delete-orphan")
    hospital_medicines = relationship(
        "HospitalMedicine", back_populates="hospital", cascade="all, delete-orphan"
    )
    hospital_services = relationship(
        "HospitalServicePrice", back_populates="hospital", cascade="all, delete-orphan"
    )
    hospital_lab_tests = relationship(
        "HospitalLabTest", back_populates="hospital", cascade="all, delete-orphan"
    )
