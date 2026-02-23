"""Add full-parity columns to doctor (Doctors.csv).

Revision ID: z26
Revises: y25
Adds: reference, date_of_birth, address, phone_home, phone_mobile, licence_no,
  department, doctor_category, email, website, gender, remarks,
  service_charges, channeling_charges, referring_charges.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "z26"
down_revision: str | None = "y25"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("doctor", sa.Column("reference", sa.String(64), nullable=True))
    op.add_column("doctor", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("doctor", sa.Column("address", sa.Text(), nullable=True))
    op.add_column("doctor", sa.Column("phone_home", sa.String(64), nullable=True))
    op.add_column("doctor", sa.Column("phone_mobile", sa.String(64), nullable=True))
    op.add_column("doctor", sa.Column("licence_no", sa.String(64), nullable=True))
    op.add_column("doctor", sa.Column("department", sa.String(255), nullable=True))
    op.add_column("doctor", sa.Column("doctor_category", sa.String(64), nullable=True))
    op.add_column("doctor", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("doctor", sa.Column("website", sa.String(255), nullable=True))
    op.add_column("doctor", sa.Column("gender", sa.String(32), nullable=True))
    op.add_column("doctor", sa.Column("remarks", sa.Text(), nullable=True))
    op.add_column("doctor", sa.Column("service_charges", sa.Numeric(12, 2), nullable=True))
    op.add_column("doctor", sa.Column("channeling_charges", sa.Numeric(12, 2), nullable=True))
    op.add_column("doctor", sa.Column("referring_charges", sa.Numeric(12, 2), nullable=True))


def downgrade() -> None:
    op.drop_column("doctor", "referring_charges")
    op.drop_column("doctor", "channeling_charges")
    op.drop_column("doctor", "service_charges")
    op.drop_column("doctor", "remarks")
    op.drop_column("doctor", "gender")
    op.drop_column("doctor", "website")
    op.drop_column("doctor", "email")
    op.drop_column("doctor", "doctor_category")
    op.drop_column("doctor", "department")
    op.drop_column("doctor", "licence_no")
    op.drop_column("doctor", "phone_mobile")
    op.drop_column("doctor", "phone_home")
    op.drop_column("doctor", "address")
    op.drop_column("doctor", "date_of_birth")
    op.drop_column("doctor", "reference")
