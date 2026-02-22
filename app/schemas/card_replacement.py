"""Pydantic schemas for card replacement API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CardReplacementReasonCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    status: str = Field("active", max_length=32)


class CardReplacementReasonUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    status: str | None = Field(None, max_length=32)


class CardReplacementReasonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    name: str
    code: str | None
    status: str


class CardReplacementCreateRequest(BaseModel):
    member_id: str | None = Field(None, max_length=64)
    dependant_id: str | None = Field(None, max_length=64)
    reason_id: str = Field(..., min_length=1, max_length=64)
    old_card_no: str | None = Field(None, max_length=64)
    new_card_no: str | None = Field(None, max_length=64)
    status: str = Field("requested", max_length=32)


class CardReplacementApproveRequest(BaseModel):
    """Optional body for POST /card-replacements/{id}/approve."""
    new_card_no: str | None = Field(None, max_length=64, description="Override new card number to issue")


class CardReplacementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    member_id: str | None
    dependant_id: str | None
    reason_id: str
    old_card_no: str | None
    new_card_no: str | None
    requested_at: datetime
    status: str
