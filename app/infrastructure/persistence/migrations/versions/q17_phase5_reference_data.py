"""Phase 5: Reference data tables (company_type, company_group, department, financial_period, insurance_type, medical_condition).

Revision ID: q17
Revises: p16
Create Date: 2025-02-19

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "q17"
down_revision: str | None = "p16"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "company_type",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(64), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_company_type_tenant_id", "company_type", ["tenant_id"])
    op.create_index("ix_company_type_code", "company_type", ["code"])

    op.create_table(
        "company_group",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_company_group_tenant_id", "company_group", ["tenant_id"])

    op.create_table(
        "department",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(64), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_department_tenant_id", "department", ["tenant_id"])
    op.create_index("ix_department_code", "department", ["code"])

    op.create_table(
        "financial_period",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_financial_period_tenant_id", "financial_period", ["tenant_id"])

    op.create_table(
        "insurance_type",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(64), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_insurance_type_tenant_id", "insurance_type", ["tenant_id"])
    op.create_index("ix_insurance_type_code", "insurance_type", ["code"])

    op.create_table(
        "medical_condition",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(64), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_medical_condition_tenant_id", "medical_condition", ["tenant_id"])
    op.create_index("ix_medical_condition_code", "medical_condition", ["code"])


def downgrade() -> None:
    op.drop_index("ix_medical_condition_code", table_name="medical_condition")
    op.drop_index("ix_medical_condition_tenant_id", table_name="medical_condition")
    op.drop_table("medical_condition")

    op.drop_index("ix_insurance_type_code", table_name="insurance_type")
    op.drop_index("ix_insurance_type_tenant_id", table_name="insurance_type")
    op.drop_table("insurance_type")

    op.drop_index("ix_financial_period_tenant_id", table_name="financial_period")
    op.drop_table("financial_period")

    op.drop_index("ix_department_code", table_name="department")
    op.drop_index("ix_department_tenant_id", table_name="department")
    op.drop_table("department")

    op.drop_index("ix_company_group_tenant_id", table_name="company_group")
    op.drop_table("company_group")

    op.drop_index("ix_company_type_code", table_name="company_type")
    op.drop_index("ix_company_type_tenant_id", table_name="company_type")
    op.drop_table("company_type")
