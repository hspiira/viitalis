"""Pydantic schemas for Member API."""

from datetime import date

from pydantic import BaseModel, Field


class MemberCreateRequest(BaseModel):
    """Request body for POST /members."""

    company_id: str = Field(..., min_length=1, max_length=64)
    scheme_id: str = Field(..., min_length=1, max_length=64)
    card_no: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=255)
    dob: date | None = None
    status: str = Field("active", max_length=32)


class MemberUpdateRequest(BaseModel):
    """Request body for PATCH /members/{id}."""

    card_no: str | None = Field(None, min_length=1, max_length=64)
    name: str | None = Field(None, min_length=1, max_length=255)
    dob: date | None = None
    status: str | None = Field(None, max_length=32)


class MemberResponse(BaseModel):
    """Response for member (single)."""

    id: str
    tenant_id: str
    company_id: str
    scheme_id: str
    card_no: str
    name: str
    dob: date | None
    status: str


class MemberListItem(BaseModel):
    """Item in list of members."""

    id: str
    tenant_id: str
    company_id: str
    scheme_id: str
    card_no: str
    name: str
    dob: date | None
    status: str


class MemberImportRow(BaseModel):
    """Single row for bulk member import."""

    company_id: str = Field(..., min_length=1, max_length=64)
    scheme_id: str = Field(..., min_length=1, max_length=64)
    card_no: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=255)
    dob: date | None = None
    status: str = Field("active", max_length=32)


class MemberImportRequest(BaseModel):
    """Request body for POST /members/import."""

    members: list[MemberImportRow] = Field(..., min_length=1, max_length=500)


class MemberImportErrorItem(BaseModel):
    """Error for one row in import."""

    row: int
    message: str


class MemberImportResponse(BaseModel):
    """Response for POST /members/import."""

    created: int
    failed: int
    errors: list[MemberImportErrorItem] = []
