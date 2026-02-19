"""Pydantic schemas for Hospital API."""

from pydantic import BaseModel, Field


class HospitalCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = None


class HospitalUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    address: str | None = None


class HospitalResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    address: str | None


class HospitalBranchCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = None


class HospitalBranchUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    address: str | None = None


class HospitalBranchResponse(BaseModel):
    id: str
    tenant_id: str
    hospital_id: str
    name: str
    address: str | None
