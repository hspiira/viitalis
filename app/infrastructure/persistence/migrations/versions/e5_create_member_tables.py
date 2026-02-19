"""Create member and member_dependant tables (tenant-scoped, soft-delete).

Revision ID: e5
Revises: d4
Create Date: 2025-02-19

Dialect-neutral. member has company_id, scheme_id FKs; member_dependant has member_id FK.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e5"
down_revision: str | None = "d4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "member",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_id", sa.String(64), sa.ForeignKey("company.id", ondelete="CASCADE"), nullable=False),
        sa.Column("scheme_id", sa.String(64), sa.ForeignKey("scheme.id", ondelete="CASCADE"), nullable=False),
        sa.Column("card_no", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("dob", sa.Date(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
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
    op.create_index("ix_member_tenant_id", "member", ["tenant_id"])
    op.create_index("ix_member_company_id", "member", ["company_id"])
    op.create_index("ix_member_scheme_id", "member", ["scheme_id"])
    op.create_index("ix_member_card_no", "member", ["card_no"])
    op.create_index("ix_member_deleted_at", "member", ["deleted_at"])

    op.create_table(
        "member_dependant",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("member_id", sa.String(64), sa.ForeignKey("member.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("dob", sa.Date(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
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
    op.create_index("ix_member_dependant_tenant_id", "member_dependant", ["tenant_id"])
    op.create_index("ix_member_dependant_member_id", "member_dependant", ["member_id"])
    op.create_index("ix_member_dependant_deleted_at", "member_dependant", ["deleted_at"])


def downgrade() -> None:
    op.drop_index("ix_member_dependant_deleted_at", table_name="member_dependant")
    op.drop_index("ix_member_dependant_member_id", table_name="member_dependant")
    op.drop_index("ix_member_dependant_tenant_id", table_name="member_dependant")
    op.drop_table("member_dependant")
    op.drop_index("ix_member_deleted_at", table_name="member")
    op.drop_index("ix_member_card_no", table_name="member")
    op.drop_index("ix_member_scheme_id", table_name="member")
    op.drop_index("ix_member_company_id", table_name="member")
    op.drop_index("ix_member_tenant_id", table_name="member")
    op.drop_table("member")
