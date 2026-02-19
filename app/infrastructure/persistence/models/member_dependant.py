"""MemberDependant ORM model. Tenant-scoped, linked to member."""

from datetime import date

from sqlalchemy import Date, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel, SoftDeleteMixin


class MemberDependant(MultiTenantModel, SoftDeleteMixin, Base):
    """Member dependant. Table: member_dependant. All queries must filter by tenant_id. Soft-deleted via deleted_at."""

    __tablename__ = "member_dependant"
    __table_args__ = (
        UniqueConstraint("tenant_id", "card_no", name="uq_member_dependant_tenant_card_no"),
    )

    member_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("member.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    card_no: Mapped[str | None] = mapped_column(String(64), nullable=True)
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)

    member = relationship("Member", back_populates="dependants")
