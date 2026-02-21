"""Pydantic schemas for Doctor API."""

from pydantic import BaseModel, ConfigDict, Field


class DoctorCreateRequest(BaseModel):
    hospital_id: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=255)
    specialization: str | None = Field(None, max_length=255)


class DoctorUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    specialization: str | None = Field(None, max_length=255)


class DoctorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    hospital_id: str
    name: str
    specialization: str | None
