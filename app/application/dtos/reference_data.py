"""DTOs for reference data: company type, company group, department, financial period, insurance type, medical condition."""

from dataclasses import dataclass
from datetime import date


# --- CompanyType ---
@dataclass
class CompanyTypeResult:
    id: str
    tenant_id: str
    name: str
    code: str | None
    description: str | None
    status: str


@dataclass
class CompanyTypeCreate:
    name: str
    code: str | None = None
    description: str | None = None
    status: str = "active"


@dataclass
class CompanyTypeUpdate:
    name: str | None = None
    code: str | None = None
    description: str | None = None
    status: str | None = None


# --- CompanyGroup ---
@dataclass
class CompanyGroupResult:
    id: str
    tenant_id: str
    name: str
    description: str | None
    status: str


@dataclass
class CompanyGroupCreate:
    name: str
    description: str | None = None
    status: str = "active"


@dataclass
class CompanyGroupUpdate:
    name: str | None = None
    description: str | None = None
    status: str | None = None


# --- Department ---
@dataclass
class DepartmentResult:
    id: str
    tenant_id: str
    name: str
    code: str | None
    status: str


@dataclass
class DepartmentCreate:
    name: str
    code: str | None = None
    status: str = "active"


@dataclass
class DepartmentUpdate:
    name: str | None = None
    code: str | None = None
    status: str | None = None


# --- FinancialPeriod ---
@dataclass
class FinancialPeriodResult:
    id: str
    tenant_id: str
    name: str
    start_date: date
    end_date: date
    is_current: bool
    status: str


@dataclass
class FinancialPeriodCreate:
    name: str
    start_date: date
    end_date: date
    is_current: bool = False
    status: str = "active"


@dataclass
class FinancialPeriodUpdate:
    name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    status: str | None = None


# --- InsuranceType ---
@dataclass
class InsuranceTypeResult:
    id: str
    tenant_id: str
    name: str
    code: str | None
    status: str


@dataclass
class InsuranceTypeCreate:
    name: str
    code: str | None = None
    status: str = "active"


@dataclass
class InsuranceTypeUpdate:
    name: str | None = None
    code: str | None = None
    status: str | None = None


# --- MedicalCondition ---
@dataclass
class MedicalConditionResult:
    id: str
    tenant_id: str
    name: str
    code: str | None
    status: str


@dataclass
class MedicalConditionCreate:
    name: str
    code: str | None = None
    status: str = "active"


@dataclass
class MedicalConditionUpdate:
    name: str | None = None
    code: str | None = None
    status: str | None = None
