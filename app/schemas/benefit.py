"""Pydantic schemas for benefit API."""

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class BenefitCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    service_name: str | None = Field(None, max_length=255)
    in_or_out_patient: str | None = Field(None, max_length=32)
    limit_amount: float | None = None
    scheme_duration: int | None = None
    covered: str = Field("yes", max_length=10)
    status: str = Field("active", max_length=32)
    remarks: str | None = None


class BenefitUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    service_name: str | None = Field(None, max_length=255)
    in_or_out_patient: str | None = Field(None, max_length=32)
    limit_amount: float | None = None
    scheme_duration: int | None = None
    covered: str | None = Field(None, max_length=10)
    status: str | None = Field(None, max_length=32)
    remarks: str | None = None


class BenefitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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


class SchemeBenefitAddRequest(BaseModel):
    benefit_id: str = Field(..., min_length=1, max_length=64)
    limit_amount: float | None = None
    copayment_percent: float | None = None
    waiting_period_days: int | None = None
    status: str = Field("active", max_length=32)


class SchemeBenefitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    scheme_id: str
    benefit_id: str
    limit_amount: float | None
    copayment_percent: float | None
    waiting_period_days: int | None
    status: str
    termination_date: date | None


class BenefitLinkageCreateRequest(BaseModel):
    benefit_id: str = Field(..., min_length=1, max_length=64)
    service_type: str = Field(..., pattern="^(medicine|service|lab|diagnosis)$")
    catalog_item_id: str = Field(..., min_length=1, max_length=64)


class BenefitLinkageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    benefit_id: str
    service_type: str
    catalog_item_id: str


class TerminateSchemeBenefitRequest(BaseModel):
    termination_date: date | None = None
