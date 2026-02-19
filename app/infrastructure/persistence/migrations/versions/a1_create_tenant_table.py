"""Create tenant table.

Revision ID: a1
Revises:
Create Date: 2025-02-19

Dialect-neutral: String, DateTime(timezone=True), CheckConstraint.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tenant",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_tenant_code", "tenant", ["code"], unique=True)
    op.create_index("ix_tenant_status", "tenant", ["status"])
    op.create_check_constraint(
        "tenant_status_check",
        "tenant",
        "status IN ('active', 'suspended', 'archived')",
    )


def downgrade() -> None:
    op.drop_constraint("tenant_status_check", "tenant", type_="check")
    op.drop_index("ix_tenant_status", table_name="tenant")
    op.drop_index("ix_tenant_code", table_name="tenant")
    op.drop_table("tenant")
