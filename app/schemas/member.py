"""Pydantic schemas for Member API."""

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class MemberCreateRequest(BaseModel):
    """Request body for POST /members."""

    company_id: str = Field(..., min_length=1, max_length=64)
    scheme_id: str = Field(..., min_length=1, max_length=64)
    card_no: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=255)
    dob: date | None = None
    status: str = Field("active", max_length=32)
    employee_no: str | None = Field(None, max_length=64)
    gender: str | None = Field(None, max_length=32)
    address: str | None = Field(None, max_length=255)
    tel_home: str | None = Field(None, max_length=64)
    tel_mobile: str | None = Field(None, max_length=64)
    email: str | None = Field(None, max_length=255)
    department: str | None = Field(None, max_length=255)
    branch: str | None = Field(None, max_length=255)
    occupation: str | None = Field(None, max_length=255)
    date_of_joining: date | None = None
    date_of_leaving: date | None = None
    remarks: str | None = Field(None, max_length=512)
    extra: dict | None = None


class MemberUpdateRequest(BaseModel):
    """Request body for PATCH /members/{id}."""

    card_no: str | None = Field(None, min_length=1, max_length=64)
    name: str | None = Field(None, min_length=1, max_length=255)
    dob: date | None = None
    status: str | None = Field(None, max_length=32)
    employee_no: str | None = Field(None, max_length=64)
    gender: str | None = Field(None, max_length=32)
    address: str | None = Field(None, max_length=255)
    tel_home: str | None = Field(None, max_length=64)
    tel_mobile: str | None = Field(None, max_length=64)
    email: str | None = Field(None, max_length=255)
    department: str | None = Field(None, max_length=255)
    branch: str | None = Field(None, max_length=255)
    occupation: str | None = Field(None, max_length=255)
    date_of_joining: date | None = None
    date_of_leaving: date | None = None
    remarks: str | None = Field(None, max_length=512)
    extra: dict | None = None


class MemberResponse(BaseModel):
    """Response for member (single)."""

    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    company_id: str
    scheme_id: str
    card_no: str
    name: str
    dob: date | None
    status: str
    employee_no: str | None = None
    gender: str | None = None
    address: str | None = None
    tel_home: str | None = None
    tel_mobile: str | None = None
    email: str | None = None
    department: str | None = None
    branch: str | None = None
    occupation: str | None = None
    date_of_joining: date | None = None
    date_of_leaving: date | None = None
    remarks: str | None = None
    extra: dict | None = None


class MemberListItem(BaseModel):
    """Item in list of members."""

    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    company_id: str
    scheme_id: str
    card_no: str
    name: str
    dob: date | None
    status: str
    employee_no: str | None = None
    gender: str | None = None
    address: str | None = None
    tel_home: str | None = None
    tel_mobile: str | None = None
    email: str | None = None
    department: str | None = None
    branch: str | None = None
    occupation: str | None = None
    date_of_joining: date | None = None
    date_of_leaving: date | None = None
    remarks: str | None = None
    extra: dict | None = None


class MemberImportRow(BaseModel):
    """Single row for bulk member import."""

    company_id: str = Field(..., min_length=1, max_length=64)
    scheme_id: str = Field(..., min_length=1, max_length=64)
    card_no: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=255)
    dob: date | None = None
    status: str = Field("active", max_length=32)
    employee_no: str | None = Field(None, max_length=64)
    gender: str | None = Field(None, max_length=32)
    address: str | None = Field(None, max_length=255)
    tel_home: str | None = Field(None, max_length=64)
    tel_mobile: str | None = Field(None, max_length=64)
    email: str | None = Field(None, max_length=255)
    department: str | None = Field(None, max_length=255)
    branch: str | None = Field(None, max_length=255)
    occupation: str | None = Field(None, max_length=255)
    date_of_joining: date | None = None
    date_of_leaving: date | None = None
    remarks: str | None = Field(None, max_length=512)
    extra: dict | None = None


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
