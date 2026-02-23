"""Lab type catalog ORM model. Tenant-scoped (e.g. Biochemistry, Haematology)."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class LabType(MultiTenantModel, Base):
    __tablename__ = "lab_type"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)
