"""Pydantic schemas for CompanyBranch API."""

from pydantic import BaseModel, ConfigDict, Field


class CompanyBranchCreateRequest(BaseModel):
    """Request body for POST /companies/{id}/branches."""

    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = None
    phone: str | None = Field(None, max_length=64)


class CompanyBranchUpdateRequest(BaseModel):
    """Request body for PATCH /companies/{id}/branches/{branch_id}."""

    name: str | None = Field(None, min_length=1, max_length=255)
    address: str | None = None
    phone: str | None = Field(None, max_length=64)


class CompanyBranchResponse(BaseModel):
    """Response for company branch (single)."""

    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    company_id: str
    name: str
    address: str | None
    phone: str | None


class CompanyBranchListItem(BaseModel):
    """Item in list of branches."""

    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    company_id: str
    name: str
    address: str | None
    phone: str | None
