"""Hospital ORM model. Tenant-scoped."""

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class Hospital(MultiTenantModel, Base):
    __tablename__ = "hospital"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

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
