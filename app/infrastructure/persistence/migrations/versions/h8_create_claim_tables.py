"""Create claim and claim_detail tables. Revision ID: h8. Revises: g7."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "h8"
down_revision: str | None = "g7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "claim",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("member_id", sa.String(64), sa.ForeignKey("member.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dependant_id", sa.String(64), sa.ForeignKey("member_dependant.id", ondelete="SET NULL"), nullable=True),
        sa.Column("hospital_id", sa.String(64), sa.ForeignKey("hospital.id", ondelete="CASCADE"), nullable=False),
        sa.Column("doctor_id", sa.String(64), sa.ForeignKey("doctor.id", ondelete="SET NULL"), nullable=True),
        sa.Column("service_date", sa.Date(), nullable=False),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="draft"),
        sa.Column("invoice_number", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_claim_tenant_id", "claim", ["tenant_id"])
    op.create_index("ix_claim_member_id", "claim", ["member_id"])
    op.create_index("ix_claim_hospital_id", "claim", ["hospital_id"])
    op.create_index("ix_claim_status", "claim", ["status"])

    op.create_table(
        "claim_detail",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("claim_id", sa.String(64), sa.ForeignKey("claim.id", ondelete="CASCADE"), nullable=False),
        sa.Column("fee_code", sa.String(64), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("unit_price", sa.Numeric(14, 2), nullable=False),
        sa.Column("qty", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_claim_detail_tenant_id", "claim_detail", ["tenant_id"])
    op.create_index("ix_claim_detail_claim_id", "claim_detail", ["claim_id"])


def downgrade() -> None:
    op.drop_index("ix_claim_detail_claim_id", table_name="claim_detail")
    op.drop_index("ix_claim_detail_tenant_id", table_name="claim_detail")
    op.drop_table("claim_detail")
    op.drop_index("ix_claim_status", table_name="claim")
    op.drop_index("ix_claim_hospital_id", table_name="claim")
    op.drop_index("ix_claim_member_id", table_name="claim")
    op.drop_index("ix_claim_tenant_id", table_name="claim")
    op.drop_table("claim")
