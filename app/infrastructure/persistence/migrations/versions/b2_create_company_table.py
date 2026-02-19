"""Create company table (tenant-scoped).

Revision ID: b2
Revises: a1
Create Date: 2025-02-19

Dialect-neutral. company.tenant_id FK to tenant.id.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b2"
down_revision: str | None = "a1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "company",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("contact_person", sa.String(255), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(64), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("website", sa.String(255), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("district_id", sa.Integer(), nullable=True),
        sa.Column("company_type", sa.Integer(), nullable=True),
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
    op.create_index("ix_company_tenant_id", "company", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_company_tenant_id", table_name="company")
    op.drop_table("company")
