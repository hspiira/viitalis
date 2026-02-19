"""Create company_branch table (tenant-scoped).

Revision ID: d4
Revises: c3
Create Date: 2025-02-19

Dialect-neutral. company_branch.company_id FK to company.id.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d4"
down_revision: str | None = "c3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "company_branch",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_id", sa.String(64), sa.ForeignKey("company.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(64), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_company_branch_tenant_id", "company_branch", ["tenant_id"])
    op.create_index("ix_company_branch_company_id", "company_branch", ["company_id"])


def downgrade() -> None:
    op.drop_index("ix_company_branch_company_id", table_name="company_branch")
    op.drop_index("ix_company_branch_tenant_id", table_name="company_branch")
    op.drop_table("company_branch")
