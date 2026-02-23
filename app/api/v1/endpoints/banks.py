"""Banks API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_bank_service
from app.application.dtos.banking import BankCreate, BankUpdate
from app.application.use_cases.banks import BankService
from app.schemas.banking import (
    BankCreateRequest,
    BankResponse,
    BankUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> BankResponse:
    """Map BankResult DTO to API response (DRY)."""
    return BankResponse.model_validate(r)


@router.post("", response_model=BankResponse, status_code=201)
async def create_bank(
    body: BankCreateRequest,
    svc: Annotated[BankService, Depends(get_bank_service)],
):
    data = BankCreate(
        name=body.name,
        code=body.code,
        status=body.status,
    )
    created = await svc.create(data)
    return _to_response(created)


@router.get("", response_model=list[BankResponse])
async def list_banks(
    svc: Annotated[BankService, Depends(get_bank_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
):
    items = await svc.list(skip=skip, limit=limit, status=status)
    return [_to_response(x) for x in items]


@router.get("/{bank_id}", response_model=BankResponse)
async def get_bank(
    bank_id: str,
    svc: Annotated[BankService, Depends(get_bank_service)],
):
    r = await svc.get_by_id(bank_id)
    return _to_response(r)


@router.patch("/{bank_id}", response_model=BankResponse)
async def update_bank(
    bank_id: str,
    body: BankUpdateRequest,
    svc: Annotated[BankService, Depends(get_bank_service)],
):
    data = BankUpdate(
        name=body.name,
        code=body.code,
        status=body.status,
    )
    updated = await svc.update(bank_id, data)
    return _to_response(updated)
