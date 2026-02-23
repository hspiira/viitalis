"""Create scheme, plan, scheme_plan tables (tenant-scoped).

Revision ID: c3
Revises: b2
Create Date: 2025-02-19

Dialect-neutral. scheme.company_id FK to company.id; scheme_plan FKs to scheme and plan.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c3"
down_revision: str | None = "b2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "scheme",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_id", sa.String(64), sa.ForeignKey("company.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("limit_value", sa.Float(), nullable=True),
        sa.Column("begin_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("termination_date", sa.Date(), nullable=True),
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
    op.create_index("ix_scheme_tenant_id", "scheme", ["tenant_id"])
    op.create_index("ix_scheme_company_id", "scheme", ["company_id"])

    op.create_table(
        "plan",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(64), nullable=True),
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
    op.create_index("ix_plan_tenant_id", "plan", ["tenant_id"])

    op.create_table(
        "scheme_plan",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("scheme_id", sa.String(64), sa.ForeignKey("scheme.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id", sa.String(64), sa.ForeignKey("plan.id", ondelete="CASCADE"), nullable=False),
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
    op.create_index("ix_scheme_plan_tenant_id", "scheme_plan", ["tenant_id"])
    op.create_index("ix_scheme_plan_scheme_id", "scheme_plan", ["scheme_id"])
    op.create_index("ix_scheme_plan_plan_id", "scheme_plan", ["plan_id"])


def downgrade() -> None:
    op.drop_index("ix_scheme_plan_plan_id", table_name="scheme_plan")
    op.drop_index("ix_scheme_plan_scheme_id", table_name="scheme_plan")
    op.drop_index("ix_scheme_plan_tenant_id", table_name="scheme_plan")
    op.drop_table("scheme_plan")
    op.drop_index("ix_plan_tenant_id", table_name="plan")
    op.drop_table("plan")
    op.drop_index("ix_scheme_company_id", table_name="scheme")
    op.drop_index("ix_scheme_tenant_id", table_name="scheme")
    op.drop_table("scheme")
