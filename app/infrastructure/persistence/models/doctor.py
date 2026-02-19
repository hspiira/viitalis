"""Doctor ORM model. Tenant-scoped, linked to hospital."""

from sqlalchemy import ForeignKey, String
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

    hospital = relationship("Hospital", back_populates="doctors")
