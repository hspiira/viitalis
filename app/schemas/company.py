"""Pydantic schemas for Company API."""

from pydantic import BaseModel, Field


class CompanyCreateRequest(BaseModel):
    """Request body for POST /companies."""

    name: str = Field(..., min_length=1, max_length=255)
    id: str | None = Field(None, min_length=1, max_length=64)  # optional; e.g. legacy code as primary key
    contact_person: str | None = Field(None, max_length=255)
    address: str | None = None
    phone: str | None = Field(None, max_length=64)
    email: str | None = Field(None, max_length=255)
    website: str | None = Field(None, max_length=255)
    remarks: str | None = None
    location: str | None = Field(None, max_length=255)
    district_id: int | None = None
    company_type: int | None = None
    status: str | None = Field(None, max_length=32)  # e.g. active, inactive; default active


class CompanyUpdateRequest(BaseModel):
    """Request body for PATCH /companies/{id}."""

    name: str | None = Field(None, min_length=1, max_length=255)
    contact_person: str | None = Field(None, max_length=255)
    address: str | None = None
    phone: str | None = Field(None, max_length=64)
    email: str | None = Field(None, max_length=255)
    website: str | None = Field(None, max_length=255)
    remarks: str | None = None
    location: str | None = Field(None, max_length=255)
    district_id: int | None = None
    company_type: int | None = None
    status: str | None = None


class CompanyResponse(BaseModel):
    """Response for company (single)."""

    id: str
    tenant_id: str
    name: str
    contact_person: str | None
    address: str | None
    phone: str | None
    email: str | None
    website: str | None
    remarks: str | None
    location: str | None
    district_id: int | None
    company_type: int | None
    status: str


class CompanyListItem(BaseModel):
    """Item in list of companies."""

    id: str
    tenant_id: str
    name: str
    contact_person: str | None
    address: str | None
    phone: str | None
    email: str | None
    website: str | None
    remarks: str | None
    location: str | None
    district_id: int | None
    company_type: int | None
    status: str
