"""Phase 7: User details, user logs, app modules and permissions.

Revision ID: s19
Revises: r18
Create Date: 2025-02-19

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "s19"
down_revision: str | None = "r18"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "app_user_detail",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.String(64), sa.ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(64), nullable=True),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_app_user_detail_user_id", "app_user_detail", ["user_id"])
    op.create_unique_constraint(
        "uq_app_user_detail_user_id", "app_user_detail", ["user_id"]
    )

    op.create_table(
        "app_user_log",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.String(64), sa.ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("module", sa.String(64), nullable=True),
        sa.Column("entity_id", sa.String(64), nullable=True),
        sa.Column("ip", sa.String(64), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_app_user_log_user_id", "app_user_log", ["user_id"])
    op.create_index("ix_app_user_log_tenant_id", "app_user_log", ["tenant_id"])
    op.create_index("ix_app_user_log_action", "app_user_log", ["action"])
    op.create_index("ix_app_user_log_created_at", "app_user_log", ["created_at"])

    op.create_table(
        "app_module",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("parent_id", sa.String(64), sa.ForeignKey("app_module.id", ondelete="SET NULL"), nullable=True),
        sa.Column("module_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_app_module_code", "app_module", ["code"], unique=True)

    op.create_table(
        "app_permission",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.String(64), sa.ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False),
        sa.Column("module_id", sa.String(64), sa.ForeignKey("app_module.id", ondelete="CASCADE"), nullable=False),
        sa.Column("can_view", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("can_create", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("can_edit", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("can_delete", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("can_approve", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_app_permission_user_id", "app_permission", ["user_id"])
    op.create_index("ix_app_permission_module_id", "app_permission", ["module_id"])
    op.create_unique_constraint(
        "uq_app_permission_user_module", "app_permission", ["user_id", "module_id"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_app_permission_user_module", "app_permission", type_="unique")
    op.drop_index("ix_app_permission_module_id", table_name="app_permission")
    op.drop_index("ix_app_permission_user_id", table_name="app_permission")
    op.drop_table("app_permission")

    op.drop_index("ix_app_module_code", table_name="app_module")
    op.drop_table("app_module")

    op.drop_index("ix_app_user_log_created_at", table_name="app_user_log")
    op.drop_index("ix_app_user_log_action", table_name="app_user_log")
    op.drop_index("ix_app_user_log_tenant_id", table_name="app_user_log")
    op.drop_index("ix_app_user_log_user_id", table_name="app_user_log")
    op.drop_table("app_user_log")

    op.drop_constraint("uq_app_user_detail_user_id", "app_user_detail", type_="unique")
    op.drop_index("ix_app_user_detail_user_id", table_name="app_user_detail")
    op.drop_table("app_user_detail")
