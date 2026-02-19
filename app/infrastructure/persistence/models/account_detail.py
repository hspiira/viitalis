"""Account detail ORM model. Member or hospital account with balance."""

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class AccountDetail(MultiTenantModel, Base):
    """Account (member or hospital). Table: account_detail."""

    __tablename__ = "account_detail"

    member_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("member.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    hospital_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("hospital.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    account_type: Mapped[str] = mapped_column(String(32), nullable=False)  # e.g. member, hospital
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    virtual_balance: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=0
    )
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="USD")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    bank_account_details = relationship(
        "BankAccountDetail",
        back_populates="account_detail",
        cascade="all, delete-orphan",
    )
