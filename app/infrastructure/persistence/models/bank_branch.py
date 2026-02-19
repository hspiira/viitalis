"""Bank branch ORM model. Belongs to a bank."""

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class BankBranch(MultiTenantModel, Base):
    """Bank branch. Table: bank_branch."""

    __tablename__ = "bank_branch"

    bank_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("bank.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    bank = relationship("Bank", back_populates="branches")
