"""DTOs for benefit, scheme_benefit, benefit_linkage."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass
class BenefitResult:
    id: str
    tenant_id: str
    name: str
    code: str | None
    service_name: str | None
    in_or_out_patient: str | None
    limit_amount: float | None
    scheme_duration: int | None
    covered: str
    status: str
    remarks: str | None


@dataclass
class BenefitCreate:
    name: str
    code: str | None = None
    service_name: str | None = None
    in_or_out_patient: str | None = None
    limit_amount: float | None = None
    scheme_duration: int | None = None
    covered: str = "yes"
    status: str = "active"
    remarks: str | None = None


@dataclass
class BenefitUpdate:
    name: str | None = None
    code: str | None = None
    service_name: str | None = None
    in_or_out_patient: str | None = None
    limit_amount: float | None = None
    scheme_duration: int | None = None
    covered: str | None = None
    status: str | None = None
    remarks: str | None = None


@dataclass
class SchemeBenefitResult:
    id: str
    tenant_id: str
    scheme_id: str
    benefit_id: str
    limit_amount: float | None
    copayment_percent: float | None
    waiting_period_days: int | None
    status: str
    termination_date: date | None


@dataclass
class SchemeBenefitCreate:
    scheme_id: str
    benefit_id: str
    limit_amount: float | None = None
    copayment_percent: float | None = None
    waiting_period_days: int | None = None
    status: str = "active"


@dataclass
class SchemeBenefitUpdate:
    limit_amount: float | None = None
    copayment_percent: float | None = None
    waiting_period_days: int | None = None
    status: str | None = None
    termination_date: date | None = None


@dataclass
class BenefitLinkageResult:
    id: str
    tenant_id: str
    benefit_id: str
    service_type: str
    catalog_item_id: str


@dataclass
class BenefitLinkageCreate:
    benefit_id: str
    service_type: str
    catalog_item_id: str
