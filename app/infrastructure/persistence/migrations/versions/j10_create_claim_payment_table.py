"""Create claim_payment table. Revision ID: j10. Revises: i9."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "j10"
down_revision: str | None = "i9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "claim_payment",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("claim_id", sa.String(64), sa.ForeignKey("claim.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("payment_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_claim_payment_tenant_id", "claim_payment", ["tenant_id"])
    op.create_index("ix_claim_payment_claim_id", "claim_payment", ["claim_id"])


def downgrade() -> None:
    op.drop_index("ix_claim_payment_claim_id", table_name="claim_payment")
    op.drop_index("ix_claim_payment_tenant_id", table_name="claim_payment")
    op.drop_table("claim_payment")
