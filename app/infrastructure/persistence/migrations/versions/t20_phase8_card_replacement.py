"""Phase 8: Card replacement reason and card replacement tables.

Revision ID: t20
Revises: s19
Create Date: 2025-02-19

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "t20"
down_revision: str | None = "s19"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "card_replacement_reason",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(64), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_card_replacement_reason_tenant_id", "card_replacement_reason", ["tenant_id"])
    op.create_index("ix_card_replacement_reason_code", "card_replacement_reason", ["code"])

    op.create_table(
        "card_replacement",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("member_id", sa.String(64), sa.ForeignKey("member.id", ondelete="SET NULL"), nullable=True),
        sa.Column("dependant_id", sa.String(64), sa.ForeignKey("member_dependant.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reason_id", sa.String(64), sa.ForeignKey("card_replacement_reason.id", ondelete="CASCADE"), nullable=False),
        sa.Column("old_card_no", sa.String(64), nullable=True),
        sa.Column("new_card_no", sa.String(64), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="requested"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_card_replacement_tenant_id", "card_replacement", ["tenant_id"])
    op.create_index("ix_card_replacement_member_id", "card_replacement", ["member_id"])
    op.create_index("ix_card_replacement_dependant_id", "card_replacement", ["dependant_id"])
    op.create_index("ix_card_replacement_reason_id", "card_replacement", ["reason_id"])


def downgrade() -> None:
    op.drop_index("ix_card_replacement_reason_id", table_name="card_replacement")
    op.drop_index("ix_card_replacement_dependant_id", table_name="card_replacement")
    op.drop_index("ix_card_replacement_member_id", table_name="card_replacement")
    op.drop_index("ix_card_replacement_tenant_id", table_name="card_replacement")
    op.drop_table("card_replacement")

    op.drop_index("ix_card_replacement_reason_code", table_name="card_replacement_reason")
    op.drop_index("ix_card_replacement_reason_tenant_id", table_name="card_replacement_reason")
    op.drop_table("card_replacement_reason")
