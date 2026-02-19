"""Create medicine, service_maintenance, lab, diagnosis catalog tables. Revision ID: g7. Revises: f6."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "g7"
down_revision: str | None = "f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table, name_col in [
        ("medicine", "name"),
        ("service_maintenance", "name"),
        ("lab", "name"),
        ("diagnosis", "name"),
    ]:
        op.create_table(
            table,
            sa.Column("id", sa.String(64), primary_key=True),
            sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
            sa.Column(name_col, sa.String(255), nullable=False),
            sa.Column("code", sa.String(64), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index(f"ix_{table}_tenant_id", table, ["tenant_id"])


def downgrade() -> None:
    for table in ["diagnosis", "lab", "service_maintenance", "medicine"]:
        op.drop_index(f"ix_{table}_tenant_id", table_name=table)
        op.drop_table(table)
