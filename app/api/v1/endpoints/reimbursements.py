"""Reimbursements API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_reimbursement_service
from app.application.dtos.reimbursement import ReimbursementCreate, ReimbursementUpdate
from app.application.use_cases.reimbursements import ReimbursementService
from app.schemas.reimbursement import (
    ReimbursementCreateRequest,
    ReimbursementResponse,
    ReimbursementStatusRequest,
)

router = APIRouter()


@router.post("", response_model=ReimbursementResponse, status_code=201)
async def create_reimbursement(
    body: ReimbursementCreateRequest,
    svc: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
):
    data = ReimbursementCreate(
        claim_id=body.claim_id, amount=body.amount, status=body.status
    )
    created = await svc.create(data)
    return ReimbursementResponse(
        id=created.id,
        tenant_id=created.tenant_id,
        claim_id=created.claim_id,
        amount=created.amount,
        status=created.status,
    )


@router.get("", response_model=list[ReimbursementResponse])
async def list_reimbursements(
    svc: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    items = await svc.list_reimbursements(skip=skip, limit=limit)
    return [
        ReimbursementResponse(
            id=r.id,
            tenant_id=r.tenant_id,
            claim_id=r.claim_id,
            amount=r.amount,
            status=r.status,
        )
        for r in items
    ]


@router.get("/{reimbursement_id}", response_model=ReimbursementResponse)
async def get_reimbursement(
    reimbursement_id: str,
    svc: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
):
    r = await svc.get_by_id(reimbursement_id)
    return ReimbursementResponse(
        id=r.id, tenant_id=r.tenant_id, claim_id=r.claim_id, amount=r.amount, status=r.status
    )


@router.patch("/{reimbursement_id}", response_model=ReimbursementResponse)
async def update_reimbursement(
    reimbursement_id: str,
    body: ReimbursementUpdateRequest,
    svc: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
):
    data = ReimbursementUpdate(status=body.status)
    updated = await svc.update(reimbursement_id, data)
    return ReimbursementResponse(
        id=updated.id,
        tenant_id=updated.tenant_id,
        claim_id=updated.claim_id,
        amount=updated.amount,
        status=updated.status,
    )


@router.patch("/{reimbursement_id}/status", response_model=ReimbursementResponse)
async def update_reimbursement_status(
    reimbursement_id: str,
    body: ReimbursementStatusRequest,
    svc: Annotated[ReimbursementService, Depends(get_reimbursement_service)],
):
    updated = await svc.update_status(reimbursement_id, body.status)
    return ReimbursementResponse(
        id=updated.id,
        tenant_id=updated.tenant_id,
        claim_id=updated.claim_id,
        amount=updated.amount,
        status=updated.status,
    )
