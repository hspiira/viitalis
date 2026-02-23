"""Lab catalog ORM model. Tenant-scoped."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class Lab(MultiTenantModel, Base):
    __tablename__ = "lab"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)

    hospital_prices = relationship(
        "HospitalLabTest", back_populates="lab", cascade="all, delete-orphan"
    )
