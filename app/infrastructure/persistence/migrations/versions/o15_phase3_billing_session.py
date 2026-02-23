"""Phase 3: Billing session table and claim.billing_session_id.

Revision ID: o15
Revises: n14
Create Date: 2025-02-19

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "o15"
down_revision: str | None = "n14"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "billing_session",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("from_date", sa.Date(), nullable=True),
        sa.Column("to_date", sa.Date(), nullable=True),
        sa.Column("total_claims", sa.Integer(), nullable=True),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="open"),
        sa.Column("created_by", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_billing_session_tenant_id", "billing_session", ["tenant_id"])
    op.create_index("ix_billing_session_status", "billing_session", ["status"])
    op.create_index("ix_billing_session_created_by", "billing_session", ["created_by"])

    op.add_column(
        "claim",
        sa.Column("billing_session_id", sa.String(64), nullable=True),
    )
    op.create_foreign_key(
        "fk_claim_billing_session_id",
        "claim",
        "billing_session",
        ["billing_session_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_claim_billing_session_id", "claim", ["billing_session_id"])


def downgrade() -> None:
    op.drop_index("ix_claim_billing_session_id", table_name="claim")
    op.drop_constraint("fk_claim_billing_session_id", "claim", type_="foreignkey")
    op.drop_column("claim", "billing_session_id")

    op.drop_index("ix_billing_session_created_by", table_name="billing_session")
    op.drop_index("ix_billing_session_status", table_name="billing_session")
    op.drop_index("ix_billing_session_tenant_id", table_name="billing_session")
    op.drop_table("billing_session")
