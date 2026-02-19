"""Phase 1: Member card_no unique per tenant; add dependant card_no (optional, unique when set).

Revision ID: m13
Revises: l12
Create Date: 2025-02-19

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "m13"
down_revision: str | None = "l12"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Member: unique (tenant_id, card_no). Drop non-unique index and add constraint.
    op.drop_index("ix_member_card_no", table_name="member")
    op.create_unique_constraint(
        "uq_member_tenant_card_no",
        "member",
        ["tenant_id", "card_no"],
    )

    # Member dependant: add optional card_no; unique (tenant_id, card_no) when set.
    op.add_column(
        "member_dependant",
        sa.Column("card_no", sa.String(64), nullable=True),
    )
    op.create_unique_constraint(
        "uq_member_dependant_tenant_card_no",
        "member_dependant",
        ["tenant_id", "card_no"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_member_dependant_tenant_card_no",
        "member_dependant",
        type_="unique",
    )
    op.drop_column("member_dependant", "card_no")

    op.drop_constraint("uq_member_tenant_card_no", "member", type_="unique")
    op.create_index("ix_member_card_no", "member", ["card_no"])
