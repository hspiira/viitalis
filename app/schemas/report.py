"""Response schemas for read-only report endpoints."""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CompanySummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_id: str
    company_name: str
    member_count: int
    claim_count: int
    total_amount: Decimal | None = None


class ClaimAnalysisSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    count: int
    total_amount: Decimal | None = None


class UtilisationByMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    member_id: str
    member_name: str
    card_no: str
    claim_count: int
    total_amount: Decimal | None = None


class HospitalSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hospital_id: str
    hospital_name: str
    claim_count: int
    total_amount: Decimal | None = None
