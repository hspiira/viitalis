"""Pydantic schemas for MemberDependant API."""

from datetime import date

from pydantic import BaseModel, Field


class MemberDependantCreateRequest(BaseModel):
    """Request body for POST /members/{id}/dependants."""

    name: str = Field(..., min_length=1, max_length=255)
    dob: date | None = None


class MemberDependantUpdateRequest(BaseModel):
    """Request body for PATCH /members/{id}/dependants/{dependant_id}."""

    name: str | None = Field(None, min_length=1, max_length=255)
    dob: date | None = None


class MemberDependantResponse(BaseModel):
    """Response for member dependant (single)."""

    id: str
    tenant_id: str
    member_id: str
    name: str
    dob: date | None


class MemberDependantListItem(BaseModel):
    """Item in list of dependants."""

    id: str
    tenant_id: str
    member_id: str
    name: str
    dob: date | None
