"""Financial periods API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_financial_period_service
from app.application.dtos.reference_data import (
    FinancialPeriodCreate,
    FinancialPeriodUpdate,
)
from app.application.use_cases.financial_periods import FinancialPeriodService
from app.schemas.reference_data import (
    FinancialPeriodCreateRequest,
    FinancialPeriodResponse,
    FinancialPeriodUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> FinancialPeriodResponse:
    return FinancialPeriodResponse(
        id=r.id,
        tenant_id=r.tenant_id,
        name=r.name,
        start_date=r.start_date,
        end_date=r.end_date,
        is_current=r.is_current,
        status=r.status,
    )


@router.post("", response_model=FinancialPeriodResponse, status_code=201)
async def create_financial_period(
    body: FinancialPeriodCreateRequest,
    svc: Annotated[FinancialPeriodService, Depends(get_financial_period_service)],
):
    data = FinancialPeriodCreate(
        name=body.name,
        start_date=body.start_date,
        end_date=body.end_date,
        is_current=body.is_current,
        status=body.status,
    )
    created = await svc.create(data)
    return _to_response(created)


@router.get("", response_model=list[FinancialPeriodResponse])
async def list_financial_periods(
    svc: Annotated[FinancialPeriodService, Depends(get_financial_period_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
):
    items = await svc.list(skip=skip, limit=limit, status=status)
    return [_to_response(x) for x in items]


@router.get("/{entity_id}", response_model=FinancialPeriodResponse)
async def get_financial_period(
    entity_id: str,
    svc: Annotated[FinancialPeriodService, Depends(get_financial_period_service)],
):
    r = await svc.get_by_id(entity_id)
    return _to_response(r)


@router.patch("/{entity_id}", response_model=FinancialPeriodResponse)
async def update_financial_period(
    entity_id: str,
    body: FinancialPeriodUpdateRequest,
    svc: Annotated[FinancialPeriodService, Depends(get_financial_period_service)],
):
    data = FinancialPeriodUpdate(
        name=body.name,
        start_date=body.start_date,
        end_date=body.end_date,
        is_current=body.is_current,
        status=body.status,
    )
    updated = await svc.update(entity_id, data)
    return _to_response(updated)
