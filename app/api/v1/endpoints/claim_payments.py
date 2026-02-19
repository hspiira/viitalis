"""Claim payments API: create, list. GET /claims/{id}/payments is in claims.py. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_claim_payment_service
from app.application.dtos.claim_payment import ClaimPaymentCreate
from app.application.use_cases.claim_payments import ClaimPaymentService
from app.schemas.claim_payment import (
    ClaimPaymentCreateRequest,
    ClaimPaymentResponse,
)

router = APIRouter()


@router.post("", response_model=ClaimPaymentResponse, status_code=201)
async def create_claim_payment(
    body: ClaimPaymentCreateRequest,
    svc: Annotated[ClaimPaymentService, Depends(get_claim_payment_service)],
):
    data = ClaimPaymentCreate(
        claim_id=body.claim_id,
        amount=body.amount,
        payment_date=body.payment_date,
    )
    created = await svc.create_payment(data)
    return ClaimPaymentResponse(
        id=created.id,
        tenant_id=created.tenant_id,
        claim_id=created.claim_id,
        amount=created.amount,
        payment_date=created.payment_date,
    )


@router.get("", response_model=list[ClaimPaymentResponse])
async def list_claim_payments(
    svc: Annotated[ClaimPaymentService, Depends(get_claim_payment_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    items = await svc.list_payments(skip=skip, limit=limit)
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
