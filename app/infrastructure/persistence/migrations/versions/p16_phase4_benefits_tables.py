"""Phase 4: Benefit, scheme_benefit, benefit_linkage tables.

Revision ID: p16
Revises: o15
Create Date: 2025-02-19

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "p16"
down_revision: str | None = "o15"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "benefit",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(64), nullable=True),
        sa.Column("service_name", sa.String(255), nullable=True),
        sa.Column("in_or_out_patient", sa.String(32), nullable=True),
        sa.Column("limit_amount", sa.Float(), nullable=True),
        sa.Column("scheme_duration", sa.Integer(), nullable=True),
        sa.Column("covered", sa.String(10), nullable=False, server_default="yes"),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_benefit_tenant_id", "benefit", ["tenant_id"])
    op.create_index("ix_benefit_code", "benefit", ["code"])

    op.create_table(
        "scheme_benefit",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("scheme_id", sa.String(64), sa.ForeignKey("scheme.id", ondelete="CASCADE"), nullable=False),
        sa.Column("benefit_id", sa.String(64), sa.ForeignKey("benefit.id", ondelete="CASCADE"), nullable=False),
        sa.Column("limit_amount", sa.Float(), nullable=True),
        sa.Column("copayment_percent", sa.Float(), nullable=True),
        sa.Column("waiting_period_days", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("termination_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_scheme_benefit_tenant_id", "scheme_benefit", ["tenant_id"])
    op.create_index("ix_scheme_benefit_scheme_id", "scheme_benefit", ["scheme_id"])
    op.create_index("ix_scheme_benefit_benefit_id", "scheme_benefit", ["benefit_id"])
    op.create_unique_constraint(
        "uq_scheme_benefit_tenant_scheme_benefit",
        "scheme_benefit",
        ["tenant_id", "scheme_id", "benefit_id"],
    )

    op.create_table(
        "benefit_linkage",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("benefit_id", sa.String(64), sa.ForeignKey("benefit.id", ondelete="CASCADE"), nullable=False),
        sa.Column("service_type", sa.String(32), nullable=False),
        sa.Column("catalog_item_id", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_benefit_linkage_tenant_id", "benefit_linkage", ["tenant_id"])
    op.create_index("ix_benefit_linkage_benefit_id", "benefit_linkage", ["benefit_id"])
    op.create_index("ix_benefit_linkage_service_type", "benefit_linkage", ["service_type"])
    op.create_unique_constraint(
        "uq_benefit_linkage_benefit_type_item",
        "benefit_linkage",
        ["benefit_id", "service_type", "catalog_item_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_benefit_linkage_benefit_type_item", "benefit_linkage", type_="unique")
    op.drop_index("ix_benefit_linkage_service_type", table_name="benefit_linkage")
    op.drop_index("ix_benefit_linkage_benefit_id", table_name="benefit_linkage")
    op.drop_index("ix_benefit_linkage_tenant_id", table_name="benefit_linkage")
    op.drop_table("benefit_linkage")

    op.drop_constraint("uq_scheme_benefit_tenant_scheme_benefit", "scheme_benefit", type_="unique")
    op.drop_index("ix_scheme_benefit_benefit_id", table_name="scheme_benefit")
    op.drop_index("ix_scheme_benefit_scheme_id", table_name="scheme_benefit")
    op.drop_index("ix_scheme_benefit_tenant_id", table_name="scheme_benefit")
    op.drop_table("scheme_benefit")

    op.drop_index("ix_benefit_code", table_name="benefit")
    op.drop_index("ix_benefit_tenant_id", table_name="benefit")
    op.drop_table("benefit")
