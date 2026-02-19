"""Plan API: create, list, get by id, update. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_plan_service
from app.application.dtos.plan import PlanCreate, PlanUpdate
from app.application.use_cases.plans import PlanService
from app.schemas.plan import (
    PlanCreateRequest,
    PlanListItem,
    PlanResponse,
    PlanUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> PlanResponse:
    """Map PlanResult DTO to API response (DRY)."""
    return PlanResponse.model_validate(r)


def _to_list_item(p) -> PlanListItem:
    """Map PlanResult to list item response (DRY)."""
    return PlanListItem.model_validate(p)


@router.post("", response_model=PlanResponse, status_code=201)
async def create_plan(
    body: PlanCreateRequest,
    plan_svc: Annotated[PlanService, Depends(get_plan_service)],
):
    """Create a plan. Requires X-Tenant-ID header."""
    data = PlanCreate(name=body.name, code=body.code)
    created = await plan_svc.create_plan(data)
    return _to_response(created)


@router.get("", response_model=list[PlanListItem])
async def list_plans(
    plan_svc: Annotated[PlanService, Depends(get_plan_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List plans for the tenant. Requires X-Tenant-ID."""
    items = await plan_svc.list_plans(skip=skip, limit=limit)
    return [_to_list_item(p) for p in items]


@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: str,
    plan_svc: Annotated[PlanService, Depends(get_plan_service)],
):
    """Get plan by ID. Requires X-Tenant-ID."""
    plan = await plan_svc.get_by_id(plan_id)
    return _to_response(plan)


@router.patch("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    body: PlanUpdateRequest,
    plan_svc: Annotated[PlanService, Depends(get_plan_service)],
):
    """Update a plan. Requires X-Tenant-ID."""
    data = PlanUpdate(name=body.name, code=body.code)
    updated = await plan_svc.update_plan(plan_id, data)
    return _to_response(updated)
