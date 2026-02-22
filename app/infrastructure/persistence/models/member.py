"""Member ORM model. Tenant-scoped, linked to company and scheme."""

from datetime import date

from sqlalchemy import Date, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel, SoftDeleteMixin


class Member(MultiTenantModel, SoftDeleteMixin, Base):
    """Member entity. Table: member. All queries must filter by tenant_id. Soft-deleted via deleted_at."""

    __tablename__ = "member"
    __table_args__ = (UniqueConstraint("tenant_id", "card_no", name="uq_member_tenant_card_no"),)

    company_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("company.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    scheme_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("scheme.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    card_no: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    employee_no: Mapped[str | None] = mapped_column(String(64), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(32), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tel_home: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tel_mobile: Mapped[str | None] = mapped_column(String(64), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    branch: Mapped[str | None] = mapped_column(String(255), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(255), nullable=True)
    date_of_joining: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_of_leaving: Mapped[date | None] = mapped_column(Date, nullable=True)
    remarks: Mapped[str | None] = mapped_column(String(512), nullable=True)
    extra: Mapped[dict | None] = mapped_column(JSON(), nullable=True)

    dependants = relationship(
        "MemberDependant",
        back_populates="member",
        cascade="all, delete-orphan",
    )
