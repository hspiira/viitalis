"""Pydantic schemas for Plan API."""

from pydantic import BaseModel, Field


class PlanCreateRequest(BaseModel):
    """Request body for POST /plans."""

    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)


class PlanUpdateRequest(BaseModel):
    """Request body for PATCH /plans/{id}."""

    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)


class PlanResponse(BaseModel):
    """Response for plan (single)."""

    id: str
    tenant_id: str
    name: str
    code: str | None


class PlanListItem(BaseModel):
    """Item in list of plans."""

    id: str
    tenant_id: str
    name: str
    code: str | None
