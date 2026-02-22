"""Pydantic schemas for Hospital API. Full parity with Hospitals.csv / Hospital Branches.csv."""

from pydantic import BaseModel, ConfigDict, Field


class HospitalCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = None
    code: str | None = Field(None, max_length=64)
    reference: str | None = Field(None, max_length=64)
    contact_person: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=64)
    email: str | None = Field(None, max_length=255)
    website: str | None = Field(None, max_length=255)
    remarks: str | None = None
    district_id: int | None = None
    outpatient_capacity: int | None = None
    inpatient_capacity: int | None = None
    out_or_in_patient: str | None = Field(None, max_length=32)  # BOTH, OUT, IN
    dental: bool | None = None
    status: str = Field("active", max_length=32)


class HospitalUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    address: str | None = None
    code: str | None = Field(None, max_length=64)
    reference: str | None = Field(None, max_length=64)
    contact_person: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=64)
    email: str | None = Field(None, max_length=255)
    website: str | None = Field(None, max_length=255)
    remarks: str | None = None
    district_id: int | None = None
    outpatient_capacity: int | None = None
    inpatient_capacity: int | None = None
    out_or_in_patient: str | None = Field(None, max_length=32)
    dental: bool | None = None
    status: str | None = Field(None, max_length=32)


class HospitalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    name: str
    address: str | None
    code: str | None
    reference: str | None
    contact_person: str | None
    phone: str | None
    email: str | None
    website: str | None
    remarks: str | None
    district_id: int | None
    outpatient_capacity: int | None
    inpatient_capacity: int | None
    out_or_in_patient: str | None
    dental: bool | None
    status: str


class HospitalBranchCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = None
    contact_person: str | None = Field(None, max_length=255)
    location: str | None = Field(None, max_length=255)
    remarks: str | None = None


class HospitalBranchUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    address: str | None = None
    contact_person: str | None = Field(None, max_length=255)
    location: str | None = Field(None, max_length=255)
    remarks: str | None = None


class HospitalBranchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    hospital_id: str
    name: str
    address: str | None
    contact_person: str | None
    location: str | None
    remarks: str | None
