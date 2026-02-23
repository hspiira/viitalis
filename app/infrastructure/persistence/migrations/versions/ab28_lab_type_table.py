"""Add lab_type catalog table. Revision ID: ab28. Revises: aa27."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "ab28"
down_revision: str | None = "aa27"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "lab_type",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_lab_type_tenant_id", "lab_type", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_lab_type_tenant_id", table_name="lab_type")
    op.drop_table("lab_type")
