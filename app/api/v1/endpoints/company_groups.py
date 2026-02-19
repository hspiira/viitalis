"""Company groups API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_company_group_service
from app.application.dtos.reference_data import (
    CompanyGroupCreate,
    CompanyGroupUpdate,
)
from app.application.use_cases.company_groups import CompanyGroupService
from app.schemas.reference_data import (
    CompanyGroupCreateRequest,
    CompanyGroupResponse,
    CompanyGroupUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> CompanyGroupResponse:
    return CompanyGroupResponse(
        id=r.id,
        tenant_id=r.tenant_id,
        name=r.name,
        description=r.description,
        status=r.status,
    )


@router.post("", response_model=CompanyGroupResponse, status_code=201)
async def create_company_group(
    body: CompanyGroupCreateRequest,
    svc: Annotated[CompanyGroupService, Depends(get_company_group_service)],
):
    data = CompanyGroupCreate(
        name=body.name,
        description=body.description,
        status=body.status,
    )
    created = await svc.create(data)
    return _to_response(created)


@router.get("", response_model=list[CompanyGroupResponse])
async def list_company_groups(
    svc: Annotated[CompanyGroupService, Depends(get_company_group_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
):
    items = await svc.list(skip=skip, limit=limit, status=status)
    return [_to_response(x) for x in items]


@router.get("/{entity_id}", response_model=CompanyGroupResponse)
async def get_company_group(
    entity_id: str,
    svc: Annotated[CompanyGroupService, Depends(get_company_group_service)],
):
    r = await svc.get_by_id(entity_id)
    return _to_response(r)


@router.patch("/{entity_id}", response_model=CompanyGroupResponse)
async def update_company_group(
    entity_id: str,
    body: CompanyGroupUpdateRequest,
    svc: Annotated[CompanyGroupService, Depends(get_company_group_service)],
):
    data = CompanyGroupUpdate(
        name=body.name,
        description=body.description,
        status=body.status,
    )
    updated = await svc.update(entity_id, data)
    return _to_response(updated)
