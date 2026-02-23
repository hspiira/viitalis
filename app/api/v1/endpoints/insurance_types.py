"""Insurance types API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_insurance_type_service
from app.application.dtos.reference_data import (
    InsuranceTypeCreate,
    InsuranceTypeUpdate,
)
from app.application.use_cases.insurance_types import InsuranceTypeService
from app.schemas.reference_data import (
    InsuranceTypeCreateRequest,
    InsuranceTypeResponse,
    InsuranceTypeUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> InsuranceTypeResponse:
    """Map InsuranceTypeResult DTO to API response (DRY)."""
    return InsuranceTypeResponse.model_validate(r)


@router.post("", response_model=InsuranceTypeResponse, status_code=201)
async def create_insurance_type(
    body: InsuranceTypeCreateRequest,
    svc: Annotated[InsuranceTypeService, Depends(get_insurance_type_service)],
):
    data = InsuranceTypeCreate(
        name=body.name,
        code=body.code,
        status=body.status,
    )
    created = await svc.create(data)
    return _to_response(created)


@router.get("", response_model=list[InsuranceTypeResponse])
async def list_insurance_types(
    svc: Annotated[InsuranceTypeService, Depends(get_insurance_type_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
):
    items = await svc.list(skip=skip, limit=limit, status=status)
    return [_to_response(x) for x in items]


@router.get("/{entity_id}", response_model=InsuranceTypeResponse)
async def get_insurance_type(
    entity_id: str,
    svc: Annotated[InsuranceTypeService, Depends(get_insurance_type_service)],
):
    r = await svc.get_by_id(entity_id)
    return _to_response(r)


@router.patch("/{entity_id}", response_model=InsuranceTypeResponse)
async def update_insurance_type(
    entity_id: str,
    body: InsuranceTypeUpdateRequest,
    svc: Annotated[InsuranceTypeService, Depends(get_insurance_type_service)],
):
    data = InsuranceTypeUpdate(
        name=body.name,
        code=body.code,
        status=body.status,
    )
    updated = await svc.update(entity_id, data)
    return _to_response(updated)
