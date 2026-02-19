"""Pydantic schemas for Scheme API."""

from datetime import date

from pydantic import BaseModel, Field


class SchemeCreateRequest(BaseModel):
    """Request body for POST /schemes."""

    company_id: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    limit_value: float | None = None
    begin_date: date | None = None
    end_date: date | None = None
    termination_date: date | None = None
    status: str = Field("active", max_length=32)


class SchemeUpdateRequest(BaseModel):
    """Request body for PATCH /schemes/{id}."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    limit_value: float | None = None
    begin_date: date | None = None
    end_date: date | None = None
    termination_date: date | None = None
    status: str | None = Field(None, max_length=32)


class SchemeResponse(BaseModel):
    """Response for scheme (single)."""

    id: str
    tenant_id: str
    company_id: str
    name: str
    description: str | None
    limit_value: float | None
    begin_date: date | None
    end_date: date | None
    termination_date: date | None
    status: str


class SchemeListItem(BaseModel):
    """Item in list of schemes."""

    id: str
    tenant_id: str
    company_id: str
    name: str
    description: str | None
    limit_value: float | None
    begin_date: date | None
    end_date: date | None
    termination_date: date | None
    status: str


class SchemePlanAddRequest(BaseModel):
    """Request body for POST /schemes/{scheme_id}/plans."""

    plan_id: str = Field(..., min_length=1, max_length=64)


class SchemePlanResponse(BaseModel):
    """Response for scheme–plan link."""

    id: str
    tenant_id: str
    scheme_id: str
    plan_id: str
