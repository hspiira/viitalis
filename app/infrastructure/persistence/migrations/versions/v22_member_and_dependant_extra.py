"""Add extra JSON column to member and member_dependant for legacy/other fields.

Revision ID: v22
Revises: u21
Create Date: 2025-02-22

Stores all non-first-class columns (e.g. from legacy CSV import) in one place
so we keep the schema simple while preserving every column.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "v22"
down_revision: str | None = "u21"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "member",
        sa.Column("extra", sa.JSON(), nullable=True),
    )
    op.add_column(
        "member_dependant",
        sa.Column("extra", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("member_dependant", "extra")
    op.drop_column("member", "extra")
