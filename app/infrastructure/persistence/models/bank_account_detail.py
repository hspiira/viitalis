"""Bank account detail: links an account to a bank/branch and account number."""

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class BankAccountDetail(MultiTenantModel, Base):
    """Link account_detail to bank/branch + account number. Table: bank_account_detail."""

    __tablename__ = "bank_account_detail"

    account_detail_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("account_detail.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    bank_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("bank.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    bank_branch_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("bank_branch.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    account_number: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    account_detail = relationship(
        "AccountDetail", back_populates="bank_account_details"
    )
