"""Add full-parity columns to hospital and hospital_branch (Hospitals.csv / Hospital Branches.csv).

Revision ID: w23
Revises: v22
Adds: hospital (reference, code, contact_person, phone, email, website, remarks,
  district_id, outpatient_capacity, inpatient_capacity, out_or_in_patient, dental, status);
  hospital_branch (contact_person, location, remarks).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "w23"
down_revision: str | None = "v22"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Hospital: full parity with Hospitals.csv
    op.add_column("hospital", sa.Column("code", sa.String(64), nullable=True))
    op.add_column("hospital", sa.Column("reference", sa.String(64), nullable=True))
    op.add_column("hospital", sa.Column("contact_person", sa.String(255), nullable=True))
    op.add_column("hospital", sa.Column("phone", sa.String(64), nullable=True))
    op.add_column("hospital", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("hospital", sa.Column("website", sa.String(255), nullable=True))
    op.add_column("hospital", sa.Column("remarks", sa.Text(), nullable=True))
    op.add_column("hospital", sa.Column("district_id", sa.Integer(), nullable=True))
    op.add_column("hospital", sa.Column("outpatient_capacity", sa.Integer(), nullable=True))
    op.add_column("hospital", sa.Column("inpatient_capacity", sa.Integer(), nullable=True))
    op.add_column("hospital", sa.Column("out_or_in_patient", sa.String(32), nullable=True))
    op.add_column("hospital", sa.Column("dental", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("hospital", sa.Column("status", sa.String(32), nullable=False, server_default="active"))

    # HospitalBranch: full parity with Hospital Branches.csv
    op.add_column("hospital_branch", sa.Column("contact_person", sa.String(255), nullable=True))
    op.add_column("hospital_branch", sa.Column("location", sa.String(255), nullable=True))
    op.add_column("hospital_branch", sa.Column("remarks", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("hospital_branch", "remarks")
    op.drop_column("hospital_branch", "location")
    op.drop_column("hospital_branch", "contact_person")

    op.drop_column("hospital", "status")
    op.drop_column("hospital", "dental")
    op.drop_column("hospital", "out_or_in_patient")
    op.drop_column("hospital", "inpatient_capacity")
    op.drop_column("hospital", "outpatient_capacity")
    op.drop_column("hospital", "district_id")
    op.drop_column("hospital", "remarks")
    op.drop_column("hospital", "website")
    op.drop_column("hospital", "email")
    op.drop_column("hospital", "phone")
    op.drop_column("hospital", "contact_person")
    op.drop_column("hospital", "reference")
    op.drop_column("hospital", "code")
