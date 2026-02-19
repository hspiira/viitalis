"""Pydantic schemas for reference data APIs."""

from datetime import date

from pydantic import BaseModel, Field


# --- CompanyType ---
class CompanyTypeCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    description: str | None = None
    status: str = Field("active", max_length=32)


class CompanyTypeUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    description: str | None = None
    status: str | None = Field(None, max_length=32)


class CompanyTypeResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    code: str | None
    description: str | None
    status: str


# --- CompanyGroup ---
class CompanyGroupCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    status: str = Field("active", max_length=32)


class CompanyGroupUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    status: str | None = Field(None, max_length=32)


class CompanyGroupResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: str | None
    status: str


# --- Department ---
class DepartmentCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    status: str = Field("active", max_length=32)


class DepartmentUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    status: str | None = Field(None, max_length=32)


class DepartmentResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    code: str | None
    status: str


# --- FinancialPeriod ---
class FinancialPeriodCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    start_date: date
    end_date: date
    is_current: bool = False
    status: str = Field("active", max_length=32)


class FinancialPeriodUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    status: str | None = Field(None, max_length=32)


class FinancialPeriodResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    start_date: date
    end_date: date
    is_current: bool
    status: str


# --- InsuranceType ---
class InsuranceTypeCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    status: str = Field("active", max_length=32)


class InsuranceTypeUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    status: str | None = Field(None, max_length=32)


class InsuranceTypeResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    code: str | None
    status: str


# --- MedicalCondition ---
class MedicalConditionCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    status: str = Field("active", max_length=32)


class MedicalConditionUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    status: str | None = Field(None, max_length=32)


class MedicalConditionResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    code: str | None
    status: str
