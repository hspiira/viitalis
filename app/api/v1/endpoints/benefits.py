"""Benefits API: CRUD for benefits; scheme-benefits and benefit linkages. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import (
    get_benefit_linkage_service,
    get_benefit_service,
    get_scheme_service,
)
from app.application.dtos.benefit import (
    BenefitCreate,
    BenefitLinkageCreate,
    BenefitUpdate,
    SchemeBenefitCreate,
)
from app.application.use_cases.benefit_linkages import BenefitLinkageService
from app.application.use_cases.benefits import BenefitService
from app.application.use_cases.schemes import SchemeService
from app.schemas.benefit import (
    BenefitCreateRequest,
    BenefitLinkageCreateRequest,
    BenefitLinkageResponse,
    BenefitResponse,
    BenefitUpdateRequest,
    SchemeBenefitAddRequest,
    SchemeBenefitResponse,
    TerminateSchemeBenefitRequest,
)

router = APIRouter()


def _benefit_to_response(r) -> BenefitResponse:
    """Map BenefitResult DTO to API response (DRY)."""
    return BenefitResponse.model_validate(r)


def _scheme_benefit_to_response(r) -> SchemeBenefitResponse:
    """Map SchemeBenefitResult DTO to API response (DRY)."""
    return SchemeBenefitResponse.model_validate(r)


def _linkage_to_response(r) -> BenefitLinkageResponse:
    """Map BenefitLinkageResult DTO to API response (DRY)."""
    return BenefitLinkageResponse.model_validate(r)


# --- Benefits CRUD ---


@router.post("", response_model=BenefitResponse, status_code=201)
async def create_benefit(
    body: BenefitCreateRequest,
    svc: Annotated[BenefitService, Depends(get_benefit_service)],
):
    """Create a benefit. Requires X-Tenant-ID header."""
    data = BenefitCreate(
        name=body.name,
        code=body.code,
        service_name=body.service_name,
        in_or_out_patient=body.in_or_out_patient,
        limit_amount=body.limit_amount,
        scheme_duration=body.scheme_duration,
        covered=body.covered,
        status=body.status,
        remarks=body.remarks,
    )
    created = await svc.create_benefit(data)
    return _benefit_to_response(created)


@router.get("", response_model=list[BenefitResponse])
async def list_benefits(
    svc: Annotated[BenefitService, Depends(get_benefit_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
):
    """List benefits for the tenant. Optional status filter. Requires X-Tenant-ID."""
    items = await svc.list_benefits(skip=skip, limit=limit, status=status)
    return [_benefit_to_response(b) for b in items]


@router.get("/{benefit_id}", response_model=BenefitResponse)
async def get_benefit(
    benefit_id: str,
    svc: Annotated[BenefitService, Depends(get_benefit_service)],
):
    """Get benefit by ID. Requires X-Tenant-ID."""
    b = await svc.get_by_id(benefit_id)
    return _benefit_to_response(b)


@router.patch("/{benefit_id}", response_model=BenefitResponse)
async def update_benefit(
    benefit_id: str,
    body: BenefitUpdateRequest,
    svc: Annotated[BenefitService, Depends(get_benefit_service)],
):
    """Update a benefit. Requires X-Tenant-ID."""
    data = BenefitUpdate(
        name=body.name,
        code=body.code,
        service_name=body.service_name,
        in_or_out_patient=body.in_or_out_patient,
        limit_amount=body.limit_amount,
        scheme_duration=body.scheme_duration,
        covered=body.covered,
        status=body.status,
        remarks=body.remarks,
    )
    updated = await svc.update_benefit(benefit_id, data)
    return _benefit_to_response(updated)


# --- Benefit linkages (under /benefits/{benefit_id}/linkages) ---


@router.get("/{benefit_id}/linkages", response_model=list[BenefitLinkageResponse])
async def list_benefit_linkages(
    benefit_id: str,
    svc: Annotated[BenefitLinkageService, Depends(get_benefit_linkage_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List linkages for a benefit. Requires X-Tenant-ID."""
    items = await svc.list_by_benefit(benefit_id, skip=skip, limit=limit)
    return [_linkage_to_response(l) for l in items]


@router.post(
    "/{benefit_id}/linkages",
    response_model=BenefitLinkageResponse,
    status_code=201,
)
async def create_benefit_linkage(
    benefit_id: str,
    body: BenefitLinkageCreateRequest,
    svc: Annotated[BenefitLinkageService, Depends(get_benefit_linkage_service)],
):
    """Add a catalog item linkage to a benefit. Fails if duplicate (benefit, service_type, catalog_item_id). Requires X-Tenant-ID."""
    data = BenefitLinkageCreate(
        benefit_id=body.benefit_id,
        service_type=body.service_type,
        catalog_item_id=body.catalog_item_id,
    )
    created = await svc.create_linkage(benefit_id, data)
    return _linkage_to_response(created)


@router.get("/{benefit_id}/linkages/{linkage_id}", response_model=BenefitLinkageResponse)
async def get_benefit_linkage(
    benefit_id: str,
    linkage_id: str,
    svc: Annotated[BenefitLinkageService, Depends(get_benefit_linkage_service)],
):
    """Get a benefit linkage by ID. Requires X-Tenant-ID."""
    l = await svc.get_linkage(linkage_id)
    return _linkage_to_response(l)


@router.delete("/{benefit_id}/linkages/{linkage_id}", status_code=204)
async def delete_benefit_linkage(
    benefit_id: str,
    linkage_id: str,
    svc: Annotated[BenefitLinkageService, Depends(get_benefit_linkage_service)],
):
    """Delete a benefit linkage. Requires X-Tenant-ID."""
    await svc.delete_linkage(linkage_id)
    return None


