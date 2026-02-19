"""Phase 2: Hospital-specific pricing tables (medicine, service, lab).

Revision ID: n14
Revises: m13
Create Date: 2025-02-19

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "n14"
down_revision: str | None = "m13"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "hospital_medicine",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hospital_id", sa.String(64), sa.ForeignKey("hospital.id", ondelete="CASCADE"), nullable=False),
        sa.Column("medicine_id", sa.String(64), sa.ForeignKey("medicine.id", ondelete="CASCADE"), nullable=False),
        sa.Column("unit_price", sa.Numeric(14, 2), nullable=False),
        sa.Column("effective_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_hospital_medicine_tenant_id", "hospital_medicine", ["tenant_id"])
    op.create_index("ix_hospital_medicine_hospital_id", "hospital_medicine", ["hospital_id"])
    op.create_index("ix_hospital_medicine_medicine_id", "hospital_medicine", ["medicine_id"])
    op.create_unique_constraint(
        "uq_hospital_medicine_tenant_hospital_medicine",
        "hospital_medicine",
        ["tenant_id", "hospital_id", "medicine_id"],
    )

    op.create_table(
        "hospital_service_price",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hospital_id", sa.String(64), sa.ForeignKey("hospital.id", ondelete="CASCADE"), nullable=False),
        sa.Column("service_id", sa.String(64), sa.ForeignKey("service_maintenance.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("effective_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_hospital_service_price_tenant_id", "hospital_service_price", ["tenant_id"])
    op.create_index("ix_hospital_service_price_hospital_id", "hospital_service_price", ["hospital_id"])
    op.create_index("ix_hospital_service_price_service_id", "hospital_service_price", ["service_id"])
    op.create_unique_constraint(
        "uq_hospital_service_price_tenant_hospital_service",
        "hospital_service_price",
        ["tenant_id", "hospital_id", "service_id"],
    )

    op.create_table(
        "hospital_lab_test",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hospital_id", sa.String(64), sa.ForeignKey("hospital.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lab_id", sa.String(64), sa.ForeignKey("lab.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("effective_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_hospital_lab_test_tenant_id", "hospital_lab_test", ["tenant_id"])
    op.create_index("ix_hospital_lab_test_hospital_id", "hospital_lab_test", ["hospital_id"])
    op.create_index("ix_hospital_lab_test_lab_id", "hospital_lab_test", ["lab_id"])
    op.create_unique_constraint(
        "uq_hospital_lab_test_tenant_hospital_lab",
        "hospital_lab_test",
        ["tenant_id", "hospital_id", "lab_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_hospital_lab_test_tenant_hospital_lab", "hospital_lab_test", type_="unique")
    op.drop_index("ix_hospital_lab_test_lab_id", table_name="hospital_lab_test")
    op.drop_index("ix_hospital_lab_test_hospital_id", table_name="hospital_lab_test")
    op.drop_index("ix_hospital_lab_test_tenant_id", table_name="hospital_lab_test")
    op.drop_table("hospital_lab_test")

    op.drop_constraint("uq_hospital_service_price_tenant_hospital_service", "hospital_service_price", type_="unique")
    op.drop_index("ix_hospital_service_price_service_id", table_name="hospital_service_price")
    op.drop_index("ix_hospital_service_price_hospital_id", table_name="hospital_service_price")
    op.drop_index("ix_hospital_service_price_tenant_id", table_name="hospital_service_price")
    op.drop_table("hospital_service_price")

    op.drop_constraint("uq_hospital_medicine_tenant_hospital_medicine", "hospital_medicine", type_="unique")
    op.drop_index("ix_hospital_medicine_medicine_id", table_name="hospital_medicine")
    op.drop_index("ix_hospital_medicine_hospital_id", table_name="hospital_medicine")
    op.drop_index("ix_hospital_medicine_tenant_id", table_name="hospital_medicine")
    op.drop_table("hospital_medicine")
