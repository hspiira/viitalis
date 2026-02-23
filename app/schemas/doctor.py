"""Pydantic schemas for Doctor API. Full parity with Doctors.csv."""

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class DoctorCreateRequest(BaseModel):
    hospital_id: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=255)
    specialization: str | None = Field(None, max_length=255)
    reference: str | None = Field(None, max_length=64)
    date_of_birth: date | None = None
    address: str | None = None
    phone_home: str | None = Field(None, max_length=64)
    phone_mobile: str | None = Field(None, max_length=64)
    licence_no: str | None = Field(None, max_length=64)
    department: str | None = Field(None, max_length=255)
    doctor_category: str | None = Field(None, max_length=64)
    email: str | None = Field(None, max_length=255)
    website: str | None = Field(None, max_length=255)
    gender: str | None = Field(None, max_length=32)
    remarks: str | None = None
    service_charges: float | None = None
    channeling_charges: float | None = None
    referring_charges: float | None = None


class DoctorUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    specialization: str | None = Field(None, max_length=255)
    reference: str | None = Field(None, max_length=64)
    date_of_birth: date | None = None
    address: str | None = None
    phone_home: str | None = Field(None, max_length=64)
    phone_mobile: str | None = Field(None, max_length=64)
    licence_no: str | None = Field(None, max_length=64)
    department: str | None = Field(None, max_length=255)
    doctor_category: str | None = Field(None, max_length=64)
    email: str | None = Field(None, max_length=255)
    website: str | None = Field(None, max_length=255)
    gender: str | None = Field(None, max_length=32)
    remarks: str | None = None
    service_charges: float | None = None
    channeling_charges: float | None = None
    referring_charges: float | None = None


class DoctorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    hospital_id: str
    name: str
    specialization: str | None
    reference: str | None
    date_of_birth: date | None
    address: str | None
    phone_home: str | None
    phone_mobile: str | None
    licence_no: str | None
    department: str | None
    doctor_category: str | None
    email: str | None
    website: str | None
    gender: str | None
    remarks: str | None
    service_charges: float | None
    channeling_charges: float | None
    referring_charges: float | None
