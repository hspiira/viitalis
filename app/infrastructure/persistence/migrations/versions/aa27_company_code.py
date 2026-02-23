"""Add code column to company for legacy/external identifiers.

Revision ID: aa27
Revises: z26
Create Date: 2025-02-23

Stores old system identifiers (e.g. COMPANY_CODE from CSV) for lookup and linking.
Unique per tenant when set.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "aa27"
down_revision: str | None = "z26"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "company",
        sa.Column("code", sa.String(64), nullable=True),
    )
    op.create_index(
        "ix_company_tenant_id_code",
        "company",
        ["tenant_id", "code"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_company_tenant_id_code", table_name="company")
    op.drop_column("company", "code")
