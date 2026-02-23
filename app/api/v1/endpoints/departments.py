"""Departments API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_department_service
from app.application.dtos.reference_data import DepartmentCreate, DepartmentUpdate
from app.application.use_cases.departments import DepartmentService
from app.schemas.reference_data import (
    DepartmentCreateRequest,
    DepartmentResponse,
    DepartmentUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> DepartmentResponse:
    """Map DepartmentResult DTO to API response (DRY)."""
    return DepartmentResponse.model_validate(r)


@router.post("", response_model=DepartmentResponse, status_code=201)
async def create_department(
    body: DepartmentCreateRequest,
    svc: Annotated[DepartmentService, Depends(get_department_service)],
):
    data = DepartmentCreate(
        name=body.name,
        code=body.code,
        status=body.status,
    )
    created = await svc.create(data)
    return _to_response(created)


@router.get("", response_model=list[DepartmentResponse])
async def list_departments(
    svc: Annotated[DepartmentService, Depends(get_department_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
):
    items = await svc.list(skip=skip, limit=limit, status=status)
    return [_to_response(x) for x in items]


@router.get("/{entity_id}", response_model=DepartmentResponse)
async def get_department(
    entity_id: str,
    svc: Annotated[DepartmentService, Depends(get_department_service)],
):
    r = await svc.get_by_id(entity_id)
    return _to_response(r)


@router.patch("/{entity_id}", response_model=DepartmentResponse)
async def update_department(
    entity_id: str,
    body: DepartmentUpdateRequest,
    svc: Annotated[DepartmentService, Depends(get_department_service)],
):
    data = DepartmentUpdate(
        name=body.name,
        code=body.code,
        status=body.status,
    )
    updated = await svc.update(entity_id, data)
    return _to_response(updated)
