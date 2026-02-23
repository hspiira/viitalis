"""Bank branches API under /banks/{bank_id}/branches. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_bank_branch_service
from app.application.dtos.banking import (
    BankBranchCreate,
    BankBranchUpdate,
)
from app.application.use_cases.bank_branches import BankBranchService
from app.schemas.banking import (
    BankBranchCreateRequest,
    BankBranchResponse,
    BankBranchUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> BankBranchResponse:
    """Map BankBranchResult DTO to API response (DRY)."""
    return BankBranchResponse.model_validate(r)


@router.post("", response_model=BankBranchResponse, status_code=201)
async def create_bank_branch(
    bank_id: str,
    body: BankBranchCreateRequest,
    svc: Annotated[BankBranchService, Depends(get_bank_branch_service)],
):
    data = BankBranchCreate(
        bank_id=bank_id,
        name=body.name,
        address=body.address,
        status=body.status,
    )
    created = await svc.create(data)
    return _to_response(created)


@router.get("", response_model=list[BankBranchResponse])
async def list_bank_branches(
    bank_id: str,
    svc: Annotated[BankBranchService, Depends(get_bank_branch_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
):
    items = await svc.list_by_bank(
        bank_id, skip=skip, limit=limit, status=status
    )
    return [_to_response(x) for x in items]


@router.get("/{branch_id}", response_model=BankBranchResponse)
async def get_bank_branch(
    bank_id: str,
    branch_id: str,
    svc: Annotated[BankBranchService, Depends(get_bank_branch_service)],
):
    r = await svc.get_by_id(branch_id)
    return _to_response(r)


@router.patch("/{branch_id}", response_model=BankBranchResponse)
async def update_bank_branch(
    bank_id: str,
    branch_id: str,
    body: BankBranchUpdateRequest,
    svc: Annotated[BankBranchService, Depends(get_bank_branch_service)],
):
    data = BankBranchUpdate(
        name=body.name,
        address=body.address,
        status=body.status,
    )
    updated = await svc.update(branch_id, data)
    return _to_response(updated)
