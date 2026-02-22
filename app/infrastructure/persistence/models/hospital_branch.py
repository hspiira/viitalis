"""HospitalBranch ORM model. Tenant-scoped. Full parity with Hospital Branches.csv."""

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class HospitalBranch(MultiTenantModel, Base):
    __tablename__ = "hospital_branch"

    hospital_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("hospital.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_person: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    hospital = relationship("Hospital", back_populates="branches")
