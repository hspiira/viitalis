"""Read-only report endpoints. Optional filters: date_from, date_to, company_id. Requires X-Tenant-ID."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_report_repo
from app.application.dtos.reports.report_dtos import (
    ClaimAnalysisSummary,
    CompanySummaryResult,
    HospitalSummaryResult,
    UtilisationByMemberResult,
)
from app.infrastructure.persistence.repositories.report_repo import ReportRepository
from app.schemas.report import (
    ClaimAnalysisSummaryResponse,
    CompanySummaryResponse,
    HospitalSummaryResponse,
    UtilisationByMemberResponse,
)

router = APIRouter()


def _company_to_res(d: CompanySummaryResult) -> CompanySummaryResponse:
    return CompanySummaryResponse(
        company_id=d.company_id,
        company_name=d.company_name,
        member_count=d.member_count,
        claim_count=d.claim_count,
        total_amount=d.total_amount,
    )


def _claim_analysis_to_res(d: ClaimAnalysisSummary) -> ClaimAnalysisSummaryResponse:
    return ClaimAnalysisSummaryResponse(
        status=d.status,
        count=d.count,
        total_amount=d.total_amount,
    )


def _utilisation_to_res(d: UtilisationByMemberResult) -> UtilisationByMemberResponse:
    return UtilisationByMemberResponse(
        member_id=d.member_id,
        member_name=d.member_name,
        card_no=d.card_no,
        claim_count=d.claim_count,
        total_amount=d.total_amount,
    )


def _hospital_to_res(d: HospitalSummaryResult) -> HospitalSummaryResponse:
    return HospitalSummaryResponse(
        hospital_id=d.hospital_id,
        hospital_name=d.hospital_name,
        claim_count=d.claim_count,
        total_amount=d.total_amount,
    )


@router.get("/company-summary", response_model=list[CompanySummaryResponse])
async def company_summary(
    report_repo: Annotated[ReportRepository, Depends(get_report_repo)],
    company_id: str | None = Query(None, description="Filter by company"),
    date_from: date | None = Query(None, description="Claims from date (inclusive)"),
    date_to: date | None = Query(None, description="Claims to date (inclusive)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
):
    """Per-company aggregates: member count, claim count, total amount."""
    rows = await report_repo.company_summary(
        company_id=company_id,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )
    return [_company_to_res(r) for r in rows]


@router.get("/claim-analysis", response_model=list[ClaimAnalysisSummaryResponse])
async def claim_analysis(
    report_repo: Annotated[ReportRepository, Depends(get_report_repo)],
    date_from: date | None = Query(None, description="Claims from date (inclusive)"),
    date_to: date | None = Query(None, description="Claims to date (inclusive)"),
):
    """Claim counts and total amount by status."""
    rows = await report_repo.claim_analysis(date_from=date_from, date_to=date_to)
    return [_claim_analysis_to_res(r) for r in rows]


@router.get("/utilisation-by-member", response_model=list[UtilisationByMemberResponse])
async def utilisation_by_member(
    report_repo: Annotated[ReportRepository, Depends(get_report_repo)],
    company_id: str | None = Query(None, description="Filter by company"),
    date_from: date | None = Query(None, description="Claims from date (inclusive)"),
    date_to: date | None = Query(None, description="Claims to date (inclusive)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """Claims and total amount per member (optionally filtered by company and date)."""
    rows = await report_repo.utilisation_by_member(
        company_id=company_id,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )
    return [_utilisation_to_res(r) for r in rows]


@router.get("/hospital-summary", response_model=list[HospitalSummaryResponse])
async def hospital_summary(
    report_repo: Annotated[ReportRepository, Depends(get_report_repo)],
    date_from: date | None = Query(None, description="Claims from date (inclusive)"),
    date_to: date | None = Query(None, description="Claims to date (inclusive)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """Claim counts and total amount per hospital."""
    rows = await report_repo.hospital_summary(
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )
    return [_hospital_to_res(r) for r in rows]
