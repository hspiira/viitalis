"""MemberDependant ORM model. Tenant-scoped, linked to member."""

from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel, SoftDeleteMixin


class MemberDependant(MultiTenantModel, SoftDeleteMixin, Base):
    """Member dependant. Table: member_dependant. All queries must filter by tenant_id. Soft-deleted via deleted_at."""

    __tablename__ = "member_dependant"

    member_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("member.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)

    member = relationship("Member", back_populates="dependants")
