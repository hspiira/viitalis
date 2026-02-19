"""Hospital-specific service pricing. Tenant-scoped."""

from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class HospitalServicePrice(MultiTenantModel, Base):
    """Hospital–service link with agreed amount. Table: hospital_service_price."""

    __tablename__ = "hospital_service_price"

    hospital_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("hospital.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    service_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("service_maintenance.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    effective_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    hospital = relationship("Hospital", back_populates="hospital_services")
    service = relationship("ServiceMaintenance", back_populates="hospital_prices")
