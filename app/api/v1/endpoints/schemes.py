"""Scheme API: create, list, get by id, update. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_scheme_service
from app.application.dtos.scheme import SchemeCreate, SchemeUpdate
from app.application.use_cases.schemes import SchemeService
from app.schemas.scheme import (
    SchemeCreateRequest,
    SchemeListItem,
    SchemePlanAddRequest,
    SchemePlanResponse,
    SchemeResponse,
    SchemeUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> SchemeResponse:
    return SchemeResponse(
        id=r.id,
        tenant_id=r.tenant_id,
        company_id=r.company_id,
        name=r.name,
        description=r.description,
        limit_value=r.limit_value,
        begin_date=r.begin_date,
        end_date=r.end_date,
        termination_date=r.termination_date,
        status=r.status,
    )


@router.post("", response_model=SchemeResponse, status_code=201)
async def create_scheme(
    body: SchemeCreateRequest,
    scheme_svc: Annotated[SchemeService, Depends(get_scheme_service)],
):
    """Create a scheme. Requires X-Tenant-ID header."""
    data = SchemeCreate(
        company_id=body.company_id,
        name=body.name,
        description=body.description,
        limit_value=body.limit_value,
        begin_date=body.begin_date,
        end_date=body.end_date,
        termination_date=body.termination_date,
        status=body.status,
    )
    created = await scheme_svc.create_scheme(data)
    return _to_response(created)


@router.get("", response_model=list[SchemeListItem])
async def list_schemes(
    scheme_svc: Annotated[SchemeService, Depends(get_scheme_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    company_id: str | None = Query(None),
):
    """List schemes for the tenant (optionally by company_id). Requires X-Tenant-ID."""
    items = await scheme_svc.list_schemes(
        skip=skip, limit=limit, company_id=company_id
    )
    return [
        SchemeListItem(
            id=s.id,
            tenant_id=s.tenant_id,
            company_id=s.company_id,
            name=s.name,
            description=s.description,
            limit_value=s.limit_value,
            begin_date=s.begin_date,
            end_date=s.end_date,
            termination_date=s.termination_date,
            status=s.status,
        )
        for s in items
    ]


@router.get("/{scheme_id}", response_model=SchemeResponse)
async def get_scheme(
    scheme_id: str,
    scheme_svc: Annotated[SchemeService, Depends(get_scheme_service)],
):
    """Get scheme by ID. Requires X-Tenant-ID."""
    scheme = await scheme_svc.get_by_id(scheme_id)
    return _to_response(scheme)


@router.patch("/{scheme_id}", response_model=SchemeResponse)
async def update_scheme(
    scheme_id: str,
    body: SchemeUpdateRequest,
    scheme_svc: Annotated[SchemeService, Depends(get_scheme_service)],
):
    """Update a scheme. Requires X-Tenant-ID."""
    data = SchemeUpdate(
        name=body.name,
        description=body.description,
        limit_value=body.limit_value,
        begin_date=body.begin_date,
        end_date=body.end_date,
        termination_date=body.termination_date,
        status=body.status,
    )
    updated = await scheme_svc.update_scheme(scheme_id, data)
    return _to_response(updated)


@router.post("/{scheme_id}/plans", response_model=SchemePlanResponse, status_code=201)
async def add_plan_to_scheme(
    scheme_id: str,
    body: SchemePlanAddRequest,
    scheme_svc: Annotated[SchemeService, Depends(get_scheme_service)],
):
    """Link a plan to a scheme. Fails if already linked. Requires X-Tenant-ID."""
    result = await scheme_svc.add_plan_to_scheme(scheme_id, body.plan_id)
    return SchemePlanResponse(
        id=result.id,
        tenant_id=result.tenant_id,
        scheme_id=result.scheme_id,
        plan_id=result.plan_id,
    )
