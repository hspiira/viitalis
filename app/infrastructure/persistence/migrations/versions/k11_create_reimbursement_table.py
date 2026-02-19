"""Create reimbursement table. Revision ID: k11. Revises: j10."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "k11"
down_revision: str | None = "j10"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "reimbursement",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("claim_id", sa.String(64), sa.ForeignKey("claim.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_reimbursement_tenant_id", "reimbursement", ["tenant_id"])
    op.create_index("ix_reimbursement_claim_id", "reimbursement", ["claim_id"])


def downgrade() -> None:
    op.drop_index("ix_reimbursement_claim_id", table_name="reimbursement")
    op.drop_index("ix_reimbursement_tenant_id", table_name="reimbursement")
    op.drop_table("reimbursement")
