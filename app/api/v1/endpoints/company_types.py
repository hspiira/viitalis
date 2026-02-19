"""Company types API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_company_type_service
from app.application.dtos.reference_data import (
    CompanyTypeCreate,
    CompanyTypeUpdate,
)
from app.application.use_cases.company_types import CompanyTypeService
from app.schemas.reference_data import (
    CompanyTypeCreateRequest,
    CompanyTypeResponse,
    CompanyTypeUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> CompanyTypeResponse:
    return CompanyTypeResponse(
        id=r.id,
        tenant_id=r.tenant_id,
        name=r.name,
        code=r.code,
        description=r.description,
        status=r.status,
    )


@router.post("", response_model=CompanyTypeResponse, status_code=201)
async def create_company_type(
    body: CompanyTypeCreateRequest,
    svc: Annotated[CompanyTypeService, Depends(get_company_type_service)],
):
    data = CompanyTypeCreate(
        name=body.name,
        code=body.code,
        description=body.description,
        status=body.status,
    )
    created = await svc.create(data)
    return _to_response(created)


@router.get("", response_model=list[CompanyTypeResponse])
async def list_company_types(
    svc: Annotated[CompanyTypeService, Depends(get_company_type_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
):
    items = await svc.list(skip=skip, limit=limit, status=status)
    return [_to_response(x) for x in items]


@router.get("/{entity_id}", response_model=CompanyTypeResponse)
async def get_company_type(
    entity_id: str,
    svc: Annotated[CompanyTypeService, Depends(get_company_type_service)],
):
    r = await svc.get_by_id(entity_id)
    return _to_response(r)


@router.patch("/{entity_id}", response_model=CompanyTypeResponse)
async def update_company_type(
    entity_id: str,
    body: CompanyTypeUpdateRequest,
    svc: Annotated[CompanyTypeService, Depends(get_company_type_service)],
):
    data = CompanyTypeUpdate(
        name=body.name,
        code=body.code,
        description=body.description,
        status=body.status,
    )
    updated = await svc.update(entity_id, data)
    return _to_response(updated)
