"""Add scheme.code and scheme_plan limit/dates/status for CSV import.

Revision ID: y25
Revises: x24
Create Date: 2025-02-22

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "y25"
down_revision: str | None = "x24"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "scheme",
        sa.Column("code", sa.String(64), nullable=True),
    )
    op.create_index("ix_scheme_code", "scheme", ["code"], unique=False)

    op.add_column(
        "scheme_plan",
        sa.Column("limit_amount", sa.Float(), nullable=True),
    )
    op.add_column(
        "scheme_plan",
        sa.Column("begin_date", sa.Date(), nullable=True),
    )
    op.add_column(
        "scheme_plan",
        sa.Column("end_date", sa.Date(), nullable=True),
    )
    op.add_column(
        "scheme_plan",
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
    )


def downgrade() -> None:
    op.drop_column("scheme_plan", "status")
    op.drop_column("scheme_plan", "end_date")
    op.drop_column("scheme_plan", "begin_date")
    op.drop_column("scheme_plan", "limit_amount")
    op.drop_index("ix_scheme_code", table_name="scheme")
    op.drop_column("scheme", "code")
