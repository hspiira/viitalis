"""Create hospital, hospital_branch, doctor tables. Revision ID: f6. Revises: e5."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f6"
down_revision: str | None = "e5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "hospital",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_hospital_tenant_id", "hospital", ["tenant_id"])

    op.create_table(
        "hospital_branch",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hospital_id", sa.String(64), sa.ForeignKey("hospital.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_hospital_branch_tenant_id", "hospital_branch", ["tenant_id"])
    op.create_index("ix_hospital_branch_hospital_id", "hospital_branch", ["hospital_id"])

    op.create_table(
        "doctor",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hospital_id", sa.String(64), sa.ForeignKey("hospital.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("specialization", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_doctor_tenant_id", "doctor", ["tenant_id"])
    op.create_index("ix_doctor_hospital_id", "doctor", ["hospital_id"])


def downgrade() -> None:
    op.drop_index("ix_doctor_hospital_id", table_name="doctor")
    op.drop_index("ix_doctor_tenant_id", table_name="doctor")
    op.drop_table("doctor")
    op.drop_index("ix_hospital_branch_hospital_id", table_name="hospital_branch")
    op.drop_index("ix_hospital_branch_tenant_id", table_name="hospital_branch")
    op.drop_table("hospital_branch")
    op.drop_index("ix_hospital_tenant_id", table_name="hospital")
    op.drop_table("hospital")
