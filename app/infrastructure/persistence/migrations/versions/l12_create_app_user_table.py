"""Create app_user table. Revision ID: l12. Revises: k11."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "l12"
down_revision: str | None = "k11"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "app_user",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_app_user_tenant_id", "app_user", ["tenant_id"])
    op.create_index("ix_app_user_username", "app_user", ["username"])
    op.create_unique_constraint(
        "uq_app_user_tenant_username", "app_user", ["tenant_id", "username"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_app_user_tenant_username", "app_user", type_="unique")
    op.drop_index("ix_app_user_username", table_name="app_user")
    op.drop_index("ix_app_user_tenant_id", table_name="app_user")
    op.drop_table("app_user")
