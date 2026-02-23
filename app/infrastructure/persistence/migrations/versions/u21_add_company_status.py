"""Add status column to company.

Revision ID: u21
Revises: t20
Create Date: 2025-02-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "u21"
down_revision: str | None = "t20"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("company", sa.Column("status", sa.String(32), nullable=False, server_default="active"))


def downgrade() -> None:
    op.drop_column("company", "status")
