"""Claims API: create (with details), list, get, update, get details, approval. Requires X-Tenant-ID."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_claim_payment_service, get_claim_service
from app.application.dtos.claim import ClaimCreate, ClaimDetailCreate, ClaimUpdate
from app.application.use_cases.claims import ClaimService
from app.application.use_cases.claim_payments import ClaimPaymentService
from app.schemas.claim import (
    ClaimCreateRequest,
    ClaimDetailResponse,
    ClaimApprovalRequest,
    ClaimBulkApprovalRequest,
    ClaimResponse,
    ClaimUpdateRequest,
)
from app.schemas.claim_payment import ClaimPaymentResponse

router = APIRouter()


def _claim_to_response(c) -> ClaimResponse:
    """Map ClaimResult DTO to API response. Single place for claim response shape (DRY)."""
    return ClaimResponse.model_validate(c)


def _claim_detail_to_response(d) -> ClaimDetailResponse:
    """Map ClaimDetailResult DTO to API response."""
    return ClaimDetailResponse.model_validate(d)


def _claim_payment_to_response(p) -> ClaimPaymentResponse:
    """Map ClaimPaymentResult DTO to API response."""
    return ClaimPaymentResponse.model_validate(p)


@router.post("", response_model=ClaimResponse, status_code=201)
async def create_claim(
    body: ClaimCreateRequest,
    svc: Annotated[ClaimService, Depends(get_claim_service)],
):
    data = ClaimCreate(
        member_id=body.member_id,
        dependant_id=body.dependant_id,
        hospital_id=body.hospital_id,
        doctor_id=body.doctor_id,
        service_date=body.service_date,
        total_amount=body.total_amount,
        status=body.status,
        invoice_number=body.invoice_number,
        billing_session_id=body.billing_session_id,
    )
    details = [
        ClaimDetailCreate(
            fee_code=d.fee_code,
            description=d.description,
            unit_price=d.unit_price,
            qty=d.qty,
            amount=d.amount,
            status=d.status,
            item_type=d.item_type,
        )
        for d in body.details
    ]
    created = await svc.create_claim(data, details)
    return _claim_to_response(created)


@router.get("", response_model=list[ClaimResponse])
async def list_claims(
    svc: Annotated[ClaimService, Depends(get_claim_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    member_id: str | None = Query(None),
    status: str | None = Query(None),
    hospital_id: str | None = Query(None),
    company_id: str | None = Query(None),
    service_date_from: date | None = Query(None),
    service_date_to: date | None = Query(None),
):
    items = await svc.list_claims(
        skip=skip,
        limit=limit,
        member_id=member_id,
        status=status,
        hospital_id=hospital_id,
        company_id=company_id,
        service_date_from=service_date_from,
        service_date_to=service_date_to,
    )
    return [_claim_to_response(c) for c in items]


@router.post("/bulk-approve")
async def bulk_approve_claims(
    body: ClaimBulkApprovalRequest,
    svc: Annotated[ClaimService, Depends(get_claim_service)],
):
    count = await svc.bulk_approve(
        body.claim_ids,
        approved=body.approved,
        approved_by=body.approved_by,
        comments=body.comments,
    )
    return {"updated_count": count}


@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(
    claim_id: str,
    svc: Annotated[ClaimService, Depends(get_claim_service)],
):
    c = await svc.get_by_id(claim_id)
    return _claim_to_response(c)


@router.get("/{claim_id}/payments", response_model=list[ClaimPaymentResponse])
async def get_claim_payments(
    claim_id: str,
    svc: Annotated[ClaimService, Depends(get_claim_service)],
    payment_svc: Annotated[ClaimPaymentService, Depends(get_claim_payment_service)],
):
    await svc.get_by_id(claim_id)  # ensure claim exists and tenant-scoped
    items = await payment_svc.list_payments_by_claim(claim_id)
    return [_claim_payment_to_response(p) for p in items]


@router.get("/{claim_id}/details", response_model=list[ClaimDetailResponse])
async def get_claim_details(
    claim_id: str,
    svc: Annotated[ClaimService, Depends(get_claim_service)],
):
    items = await svc.list_details(claim_id)
    return [_claim_detail_to_response(d) for d in items]


@router.patch("/{claim_id}", response_model=ClaimResponse)
async def update_claim(
    claim_id: str,
    body: ClaimUpdateRequest,
    svc: Annotated[ClaimService, Depends(get_claim_service)],
):
    data = ClaimUpdate(
        service_date=body.service_date,
        total_amount=body.total_amount,
        status=body.status,
        invoice_number=body.invoice_number,
    )
    updated = await svc.update_claim(claim_id, data)
    return _claim_to_response(updated)


@router.patch("/{claim_id}/approval", response_model=ClaimResponse)
async def update_claim_approval(
    claim_id: str,
    body: ClaimApprovalRequest,
    svc: Annotated[ClaimService, Depends(get_claim_service)],
):
    updated = await svc.update_approval(
        claim_id,
        approved=body.approved,
        approved_by=body.approved_by,
        comments=body.comments,
    )
    return _claim_to_response(updated)
