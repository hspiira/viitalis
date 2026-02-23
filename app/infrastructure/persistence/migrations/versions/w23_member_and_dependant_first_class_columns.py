"""Add first-class columns to member and member_dependant (from legacy CSV).

Revision ID: x24
Revises: w23
Create Date: 2025-02-22

Member: employee_no, gender, address, tel_home, tel_mobile, email, department,
branch, occupation, date_of_joining, date_of_leaving, remarks.
Member_dependant: relationship, gender, address, tel_home, tel_mobile, status, next_of_kin.
All nullable so existing rows and imports are unaffected.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "x24"
down_revision: str | None = "w23"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Member: legacy columns from Members.csv as first-class
    op.add_column("member", sa.Column("employee_no", sa.String(64), nullable=True))
    op.add_column("member", sa.Column("gender", sa.String(32), nullable=True))
    op.add_column("member", sa.Column("address", sa.String(255), nullable=True))
    op.add_column("member", sa.Column("tel_home", sa.String(64), nullable=True))
    op.add_column("member", sa.Column("tel_mobile", sa.String(64), nullable=True))
    op.add_column("member", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("member", sa.Column("department", sa.String(255), nullable=True))
    op.add_column("member", sa.Column("branch", sa.String(255), nullable=True))
    op.add_column("member", sa.Column("occupation", sa.String(255), nullable=True))
    op.add_column("member", sa.Column("date_of_joining", sa.Date(), nullable=True))
    op.add_column("member", sa.Column("date_of_leaving", sa.Date(), nullable=True))
    op.add_column("member", sa.Column("remarks", sa.String(512), nullable=True))

    # Member_dependant: legacy columns from Member deps.csv as first-class
    op.add_column("member_dependant", sa.Column("relationship", sa.String(64), nullable=True))
    op.add_column("member_dependant", sa.Column("gender", sa.String(32), nullable=True))
    op.add_column("member_dependant", sa.Column("address", sa.String(255), nullable=True))
    op.add_column("member_dependant", sa.Column("tel_home", sa.String(64), nullable=True))
    op.add_column("member_dependant", sa.Column("tel_mobile", sa.String(64), nullable=True))
    op.add_column("member_dependant", sa.Column("status", sa.String(32), nullable=True))
    op.add_column("member_dependant", sa.Column("next_of_kin", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("member_dependant", "next_of_kin")
    op.drop_column("member_dependant", "status")
    op.drop_column("member_dependant", "tel_mobile")
    op.drop_column("member_dependant", "tel_home")
    op.drop_column("member_dependant", "address")
    op.drop_column("member_dependant", "gender")
    op.drop_column("member_dependant", "relationship")

    op.drop_column("member", "remarks")
    op.drop_column("member", "date_of_leaving")
    op.drop_column("member", "date_of_joining")
    op.drop_column("member", "occupation")
    op.drop_column("member", "branch")
    op.drop_column("member", "department")
    op.drop_column("member", "email")
    op.drop_column("member", "tel_mobile")
    op.drop_column("member", "tel_home")
    op.drop_column("member", "address")
    op.drop_column("member", "gender")
    op.drop_column("member", "employee_no")
