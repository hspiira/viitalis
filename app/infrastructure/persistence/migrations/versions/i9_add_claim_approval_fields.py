"""Add claim approval fields (approved_at, approved_by, approval_comments). Revision ID: i9. Revises: h8."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "i9"
down_revision: str | None = "h8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("claim", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("claim", sa.Column("approved_by", sa.String(64), nullable=True))
    op.add_column("claim", sa.Column("approval_comments", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("claim", "approval_comments")
    op.drop_column("claim", "approved_by")
    op.drop_column("claim", "approved_at")
