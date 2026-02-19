"""Medicine catalog ORM model. Tenant-scoped."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class Medicine(MultiTenantModel, Base):
    __tablename__ = "medicine"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), nullable=True)

    hospital_prices = relationship(
        "HospitalMedicine", back_populates="medicine", cascade="all, delete-orphan"
    )
