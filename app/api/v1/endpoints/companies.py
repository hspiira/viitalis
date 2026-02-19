"""Company API: create, list, get by id, update. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_company_service
from app.application.dtos.company import CompanyCreate, CompanyUpdate
from app.application.use_cases.companies import CompanyService
from app.schemas.company import (
    CompanyCreateRequest,
    CompanyListItem,
    CompanyResponse,
    CompanyUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> CompanyResponse:
    """Map CompanyResult DTO to API response (DRY)."""
    return CompanyResponse.model_validate(r)


def _to_list_item(c) -> CompanyListItem:
    """Map CompanyResult to list item response (DRY)."""
    return CompanyListItem.model_validate(c)


@router.post("", response_model=CompanyResponse, status_code=201)
async def create_company(
    body: CompanyCreateRequest,
    company_svc: Annotated[CompanyService, Depends(get_company_service)],
):
    """Create a company. Requires X-Tenant-ID header."""
    data = CompanyCreate(
        name=body.name,
        contact_person=body.contact_person,
        address=body.address,
        phone=body.phone,
        email=body.email,
        website=body.website,
        remarks=body.remarks,
        location=body.location,
        district_id=body.district_id,
        company_type=body.company_type,
    )
    created = await company_svc.create_company(data)
    return _to_response(created)


@router.get("", response_model=list[CompanyListItem])
async def list_companies(
    company_svc: Annotated[CompanyService, Depends(get_company_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List companies for the tenant. Requires X-Tenant-ID."""
    items = await company_svc.list_companies(skip=skip, limit=limit)
    return [_to_list_item(c) for c in items]


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: str,
    company_svc: Annotated[CompanyService, Depends(get_company_service)],
):
    """Get company by ID. Requires X-Tenant-ID."""
    company = await company_svc.get_by_id(company_id)
    return _to_response(company)


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    body: CompanyUpdateRequest,
    company_svc: Annotated[CompanyService, Depends(get_company_service)],
):
    """Update a company. Requires X-Tenant-ID."""
    data = CompanyUpdate(
        name=body.name,
        contact_person=body.contact_person,
        address=body.address,
        phone=body.phone,
        email=body.email,
        website=body.website,
        remarks=body.remarks,
        location=body.location,
        district_id=body.district_id,
        company_type=body.company_type,
    )
    updated = await company_svc.update_company(company_id, data)
    return _to_response(updated)


@router.delete("/{company_id}", status_code=204)
async def delete_company(
    company_id: str,
    company_svc: Annotated[CompanyService, Depends(get_company_service)],
):
    """Delete a company. Fails if company has any members. Requires X-Tenant-ID."""
    await company_svc.delete_company(company_id)
