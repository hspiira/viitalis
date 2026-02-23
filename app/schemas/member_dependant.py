"""Pydantic schemas for MemberDependant API."""

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class MemberDependantCreateRequest(BaseModel):
    """Request body for POST /members/{id}/dependants."""

    name: str = Field(..., min_length=1, max_length=255)
    card_no: str | None = Field(None, max_length=64)
    dob: date | None = None
    relationship: str | None = Field(None, max_length=64)
    gender: str | None = Field(None, max_length=32)
    address: str | None = Field(None, max_length=255)
    tel_home: str | None = Field(None, max_length=64)
    tel_mobile: str | None = Field(None, max_length=64)
    status: str | None = Field(None, max_length=32)
    next_of_kin: str | None = Field(None, max_length=255)
    extra: dict | None = None


class MemberDependantUpdateRequest(BaseModel):
    """Request body for PATCH /members/{id}/dependants/{dependant_id}."""

    name: str | None = Field(None, min_length=1, max_length=255)
    card_no: str | None = Field(None, max_length=64)
    dob: date | None = None
    relationship: str | None = Field(None, max_length=64)
    gender: str | None = Field(None, max_length=32)
    address: str | None = Field(None, max_length=255)
    tel_home: str | None = Field(None, max_length=64)
    tel_mobile: str | None = Field(None, max_length=64)
    status: str | None = Field(None, max_length=32)
    next_of_kin: str | None = Field(None, max_length=255)
    extra: dict | None = None


class MemberDependantResponse(BaseModel):
    """Response for member dependant (single)."""

    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    member_id: str
    name: str
    card_no: str | None
    dob: date | None
    relationship: str | None = None
    gender: str | None = None
    address: str | None = None
    tel_home: str | None = None
    tel_mobile: str | None = None
    status: str | None = None
    next_of_kin: str | None = None
    extra: dict | None = None


class MemberDependantListItem(BaseModel):
    """Item in list of dependants."""

    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    member_id: str
    name: str
    card_no: str | None
    dob: date | None
    relationship: str | None = None
    gender: str | None = None
    address: str | None = None
    tel_home: str | None = None
    tel_mobile: str | None = None
    status: str | None = None
    next_of_kin: str | None = None
    extra: dict | None = None
