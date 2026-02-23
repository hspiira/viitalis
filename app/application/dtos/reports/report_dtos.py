"""Reporting DTOs: company summary, claim analysis, utilisation, hospital summary."""

from dataclasses import dataclass
from decimal import Decimal


@dataclass
class CompanySummaryResult:
    """Aggregate per company (member count, claim count, total amount)."""
    company_id: str
    company_name: str
    member_count: int
    claim_count: int
    total_amount: Decimal | None


@dataclass
class ClaimAnalysisSummary:
    """Claim counts and total by status (optionally by date range)."""
    status: str
    count: int
    total_amount: Decimal | None


@dataclass
class UtilisationByMemberResult:
    """Claims and total amount per member."""
    member_id: str
    member_name: str
    card_no: str
    claim_count: int
    total_amount: Decimal | None


@dataclass
class HospitalSummaryResult:
    """Claim counts and total per hospital."""
    hospital_id: str
    hospital_name: str
    claim_count: int
    total_amount: Decimal | None
