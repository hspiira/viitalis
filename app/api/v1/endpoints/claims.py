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
    return ClaimResponse(
        id=created.id,
        tenant_id=created.tenant_id,
        member_id=created.member_id,
        dependant_id=created.dependant_id,
        hospital_id=created.hospital_id,
        doctor_id=created.doctor_id,
        service_date=created.service_date,
        total_amount=created.total_amount,
        status=created.status,
        invoice_number=created.invoice_number,
        approved_at=created.approved_at,
        approved_by=created.approved_by,
        approval_comments=created.approval_comments,
        billing_session_id=created.billing_session_id,
    )


@router.get("", response_model=list[ClaimResponse])
async def list_claims(
    svc: Annotated[ClaimService, Depends(get_claim_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    member_id: str | None = Query(None),
    status: str | None = Query(None),
    hospital_id: str | None = Query(None),
    service_date_from: date | None = Query(None),
    service_date_to: date | None = Query(None),
):
    items = await svc.list_claims(
        skip=skip,
        limit=limit,
        member_id=member_id,
        status=status,
        hospital_id=hospital_id,
        service_date_from=service_date_from,
        service_date_to=service_date_to,
    )
    return [
        ClaimResponse(
            id=c.id,
            tenant_id=c.tenant_id,
            member_id=c.member_id,
            dependant_id=c.dependant_id,
            hospital_id=c.hospital_id,
            doctor_id=c.doctor_id,
            service_date=c.service_date,
            total_amount=c.total_amount,
            status=c.status,
            invoice_number=c.invoice_number,
            approved_at=c.approved_at,
            approved_by=c.approved_by,
            approval_comments=c.approval_comments,
            billing_session_id=c.billing_session_id,
        )
        for c in items
    ]


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
    return ClaimResponse(
        id=c.id,
        tenant_id=c.tenant_id,
        member_id=c.member_id,
        dependant_id=c.dependant_id,
        hospital_id=c.hospital_id,
        doctor_id=c.doctor_id,
        service_date=c.service_date,
        total_amount=c.total_amount,
        status=c.status,
        invoice_number=c.invoice_number,
        approved_at=c.approved_at,
        approved_by=c.approved_by,
        approval_comments=c.approval_comments,
        billing_session_id=c.billing_session_id,
    )


@router.get("/{claim_id}/payments", response_model=list[ClaimPaymentResponse])
async def get_claim_payments(
    claim_id: str,
    svc: Annotated[ClaimService, Depends(get_claim_service)],
    payment_svc: Annotated[ClaimPaymentService, Depends(get_claim_payment_service)],
):
    await svc.get_by_id(claim_id)  # ensure claim exists and tenant-scoped
    items = await payment_svc.list_payments_by_claim(claim_id)
    return [
        ClaimPaymentResponse(
            id=p.id,
            tenant_id=p.tenant_id,
            claim_id=p.claim_id,
            amount=p.amount,
            payment_date=p.payment_date,
        )
        for p in items
    ]


@router.get("/{claim_id}/details", response_model=list[ClaimDetailResponse])
async def get_claim_details(
    claim_id: str,
    svc: Annotated[ClaimService, Depends(get_claim_service)],
):
    items = await svc.list_details(claim_id)
    return [
        ClaimDetailResponse(
            id=d.id,
            tenant_id=d.tenant_id,
            claim_id=d.claim_id,
            fee_code=d.fee_code,
            description=d.description,
            unit_price=d.unit_price,
            qty=d.qty,
            amount=d.amount,
            status=d.status,
        )
        for d in items
    ]


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
    return ClaimResponse(
        id=updated.id,
        tenant_id=updated.tenant_id,
        member_id=updated.member_id,
        dependant_id=updated.dependant_id,
        hospital_id=updated.hospital_id,
        doctor_id=updated.doctor_id,
        service_date=updated.service_date,
        total_amount=updated.total_amount,
        status=updated.status,
        invoice_number=updated.invoice_number,
        approved_at=updated.approved_at,
        approved_by=updated.approved_by,
        approval_comments=updated.approval_comments,
        billing_session_id=updated.billing_session_id,
    )


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
    return ClaimResponse(
        id=updated.id,
        tenant_id=updated.tenant_id,
        member_id=updated.member_id,
        dependant_id=updated.dependant_id,
        hospital_id=updated.hospital_id,
        doctor_id=updated.doctor_id,
        service_date=updated.service_date,
        total_amount=updated.total_amount,
        status=updated.status,
        invoice_number=updated.invoice_number,
        approved_at=updated.approved_at,
        approved_by=updated.approved_by,
        approval_comments=updated.approval_comments,
        billing_session_id=updated.billing_session_id,
    )
