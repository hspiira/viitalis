"""Medical conditions API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_medical_condition_service
from app.application.dtos.reference_data import (
    MedicalConditionCreate,
    MedicalConditionUpdate,
)
from app.application.use_cases.medical_conditions import MedicalConditionService
from app.schemas.reference_data import (
    MedicalConditionCreateRequest,
    MedicalConditionResponse,
    MedicalConditionUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> MedicalConditionResponse:
    """Map MedicalConditionResult DTO to API response (DRY)."""
    return MedicalConditionResponse.model_validate(r)


@router.post("", response_model=MedicalConditionResponse, status_code=201)
async def create_medical_condition(
    body: MedicalConditionCreateRequest,
    svc: Annotated[MedicalConditionService, Depends(get_medical_condition_service)],
):
    data = MedicalConditionCreate(
        name=body.name,
        code=body.code,
        status=body.status,
    )
    created = await svc.create(data)
    return _to_response(created)


@router.get("", response_model=list[MedicalConditionResponse])
async def list_medical_conditions(
    svc: Annotated[MedicalConditionService, Depends(get_medical_condition_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
):
    items = await svc.list(skip=skip, limit=limit, status=status)
    return [_to_response(x) for x in items]


@router.get("/{entity_id}", response_model=MedicalConditionResponse)
async def get_medical_condition(
    entity_id: str,
    svc: Annotated[MedicalConditionService, Depends(get_medical_condition_service)],
):
    r = await svc.get_by_id(entity_id)
    return _to_response(r)


@router.patch("/{entity_id}", response_model=MedicalConditionResponse)
async def update_medical_condition(
    entity_id: str,
    body: MedicalConditionUpdateRequest,
    svc: Annotated[MedicalConditionService, Depends(get_medical_condition_service)],
):
    data = MedicalConditionUpdate(
        name=body.name,
        code=body.code,
        status=body.status,
    )
    updated = await svc.update(entity_id, data)
    return _to_response(updated)
