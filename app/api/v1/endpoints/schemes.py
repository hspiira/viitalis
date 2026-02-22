"""Scheme API: create, list, get by id, update. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Body, Depends, Query

from app.api.v1.dependencies import get_scheme_service
from app.application.dtos.scheme import SchemeCreate, SchemeUpdate
from app.application.use_cases.schemes import SchemeService
from app.application.dtos.benefit import SchemeBenefitCreate
from app.schemas.benefit import (
    SchemeBenefitAddRequest,
    SchemeBenefitResponse,
    TerminateSchemeBenefitRequest,
)
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
    """Map SchemeResult DTO to API response (DRY)."""
    return SchemeResponse.model_validate(r)


def _to_list_item(s) -> SchemeListItem:
    """Map SchemeResult to list item response (DRY)."""
    return SchemeListItem.model_validate(s)


def _plan_to_response(r) -> SchemePlanResponse:
    """Map SchemePlanResult DTO to API response (DRY)."""
    return SchemePlanResponse.model_validate(r)


@router.post("", response_model=SchemeResponse, status_code=201)
async def create_scheme(
    body: SchemeCreateRequest,
    scheme_svc: Annotated[SchemeService, Depends(get_scheme_service)],
):
    """Create a scheme. Requires X-Tenant-ID header."""
    data = SchemeCreate(
        company_id=body.company_id,
        name=body.name,
        code=body.code,
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
    code: str | None = Query(None, description="Filter by legacy/reference code"),
):
    """List schemes for the tenant (optionally by company_id or code). Requires X-Tenant-ID."""
    items = await scheme_svc.list_schemes(
        skip=skip, limit=limit, company_id=company_id, code=code
    )
    return [_to_list_item(s) for s in items]


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
        code=body.code,
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
    """Link a plan to a scheme (optional limit/dates for period rows). Requires X-Tenant-ID."""
    result = await scheme_svc.add_plan_to_scheme(
        scheme_id,
        body.plan_id,
        limit_amount=body.limit_amount,
        begin_date=body.begin_date,
        end_date=body.end_date,
        status=body.status,
    )
    return _plan_to_response(result)


# --- Scheme benefits ---


def _scheme_benefit_to_response(r) -> SchemeBenefitResponse:
    """Map SchemeBenefitResult DTO to API response (DRY)."""
    return SchemeBenefitResponse.model_validate(r)


@router.get("/{scheme_id}/benefits", response_model=list[SchemeBenefitResponse])
async def list_scheme_benefits(
    scheme_id: str,
    scheme_svc: Annotated[SchemeService, Depends(get_scheme_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List benefits linked to a scheme. Requires X-Tenant-ID."""
    items = await scheme_svc.list_scheme_benefits(
        scheme_id, skip=skip, limit=limit
    )
    return [_scheme_benefit_to_response(sb) for sb in items]


@router.post(
    "/{scheme_id}/benefits",
    response_model=SchemeBenefitResponse,
    status_code=201,
)
async def add_benefit_to_scheme(
    scheme_id: str,
    body: SchemeBenefitAddRequest,
    scheme_svc: Annotated[SchemeService, Depends(get_scheme_service)],
):
    """Link a benefit to a scheme. Fails if already linked. Requires X-Tenant-ID."""
    data = SchemeBenefitCreate(
        scheme_id=scheme_id,
        benefit_id=body.benefit_id,
        limit_amount=body.limit_amount,
        copayment_percent=body.copayment_percent,
        waiting_period_days=body.waiting_period_days,
        status=body.status,
    )
    result = await scheme_svc.add_benefit_to_scheme(scheme_id, data)
    return _scheme_benefit_to_response(result)


@router.get(
    "/{scheme_id}/benefits/{scheme_benefit_id}",
    response_model=SchemeBenefitResponse,
)
async def get_scheme_benefit(
    scheme_id: str,
    scheme_benefit_id: str,
    scheme_svc: Annotated[SchemeService, Depends(get_scheme_service)],
):
    """Get a scheme-benefit link by ID. Requires X-Tenant-ID."""
    sb = await scheme_svc.get_scheme_benefit(scheme_benefit_id)
    return _scheme_benefit_to_response(sb)


@router.post(
    "/{scheme_id}/benefits/{scheme_benefit_id}/terminate",
    response_model=SchemeBenefitResponse,
)
async def terminate_scheme_benefit(
    scheme_id: str,
    scheme_benefit_id: str,
    scheme_svc: Annotated[SchemeService, Depends(get_scheme_service)],
    body: TerminateSchemeBenefitRequest | None = Body(None),
):
    """Terminate a scheme-benefit (set status=terminated, optional termination_date). Requires X-Tenant-ID."""
    termination_date = body.termination_date if body is not None else None
    result = await scheme_svc.terminate_scheme_benefit(
        scheme_benefit_id, termination_date=termination_date
    )
    return _scheme_benefit_to_response(result)
