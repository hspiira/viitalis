"""Phase 6: Banking and accounts (bank, bank_branch, account_detail, bank_account_detail).

Revision ID: r18
Revises: q17
Create Date: 2025-02-19

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "r18"
down_revision: str | None = "q17"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "bank",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(64), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_bank_tenant_id", "bank", ["tenant_id"])
    op.create_index("ix_bank_code", "bank", ["code"])

    op.create_table(
        "bank_branch",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bank_id", sa.String(64), sa.ForeignKey("bank.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_bank_branch_tenant_id", "bank_branch", ["tenant_id"])
    op.create_index("ix_bank_branch_bank_id", "bank_branch", ["bank_id"])

    op.create_table(
        "account_detail",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("member_id", sa.String(64), sa.ForeignKey("member.id", ondelete="SET NULL"), nullable=True),
        sa.Column("hospital_id", sa.String(64), sa.ForeignKey("hospital.id", ondelete="SET NULL"), nullable=True),
        sa.Column("account_type", sa.String(32), nullable=False),
        sa.Column("balance", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("virtual_balance", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(8), nullable=False, server_default="USD"),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_account_detail_tenant_id", "account_detail", ["tenant_id"])
    op.create_index("ix_account_detail_member_id", "account_detail", ["member_id"])
    op.create_index("ix_account_detail_hospital_id", "account_detail", ["hospital_id"])

    op.create_table(
        "bank_account_detail",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_detail_id", sa.String(64), sa.ForeignKey("account_detail.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bank_id", sa.String(64), sa.ForeignKey("bank.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bank_branch_id", sa.String(64), sa.ForeignKey("bank_branch.id", ondelete="SET NULL"), nullable=True),
        sa.Column("account_number", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_bank_account_detail_tenant_id", "bank_account_detail", ["tenant_id"])
    op.create_index("ix_bank_account_detail_account_detail_id", "bank_account_detail", ["account_detail_id"])
    op.create_index("ix_bank_account_detail_bank_id", "bank_account_detail", ["bank_id"])


def downgrade() -> None:
    op.drop_index("ix_bank_account_detail_bank_id", table_name="bank_account_detail")
    op.drop_index("ix_bank_account_detail_account_detail_id", table_name="bank_account_detail")
    op.drop_index("ix_bank_account_detail_tenant_id", table_name="bank_account_detail")
    op.drop_table("bank_account_detail")

    op.drop_index("ix_account_detail_hospital_id", table_name="account_detail")
    op.drop_index("ix_account_detail_member_id", table_name="account_detail")
    op.drop_index("ix_account_detail_tenant_id", table_name="account_detail")
    op.drop_table("account_detail")

    op.drop_index("ix_bank_branch_bank_id", table_name="bank_branch")
    op.drop_index("ix_bank_branch_tenant_id", table_name="bank_branch")
    op.drop_table("bank_branch")

    op.drop_index("ix_bank_code", table_name="bank")
    op.drop_index("ix_bank_tenant_id", table_name="bank")
    op.drop_table("bank")
