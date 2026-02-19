"""Benefit–catalog item linkage. Links benefit to medicine/service/lab/diagnosis."""

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.persistence.database import Base
from app.infrastructure.persistence.models.mixins import MultiTenantModel


class BenefitLinkage(MultiTenantModel, Base):
    """Link benefit to a catalog item. Table: benefit_linkage."""

    __tablename__ = "benefit_linkage"
    __table_args__ = (
        UniqueConstraint(
            "benefit_id",
            "service_type",
            "catalog_item_id",
            name="uq_benefit_linkage_benefit_type_item",
        ),
    )

    benefit_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("benefit.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    service_type: Mapped[str] = mapped_column(
        String(32), nullable=False, index=True
    )  # medicine | service | lab | diagnosis
    catalog_item_id: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )

    benefit = relationship("Benefit", back_populates="linkages")
