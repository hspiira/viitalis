"""Add remarks to catalog tables. Revision ID: ac29. Revises: ab28."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "ac29"
down_revision: str | None = "ab28"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table in ("medicine", "service_maintenance", "lab", "lab_type", "diagnosis"):
        op.add_column(
            table,
            sa.Column("remarks", sa.String(500), nullable=True),
        )


def downgrade() -> None:
    for table in ("diagnosis", "lab_type", "lab", "service_maintenance", "medicine"):
        op.drop_column(table, "remarks")
