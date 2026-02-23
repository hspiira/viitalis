"""Company branches API: list, create, get, update under /companies/{company_id}/branches. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.v1.dependencies import get_company_branch_service
from app.application.dtos.company_branch import CompanyBranchCreate, CompanyBranchUpdate
from app.application.use_cases.company_branches import CompanyBranchService
from app.schemas.company_branch import (
    CompanyBranchCreateRequest,
    CompanyBranchListItem,
    CompanyBranchResponse,
    CompanyBranchUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> CompanyBranchResponse:
    """Map CompanyBranchResult DTO to API response (DRY)."""
    return CompanyBranchResponse.model_validate(r)


def _to_list_item(b) -> CompanyBranchListItem:
    """Map CompanyBranchResult to list item response (DRY)."""
    return CompanyBranchListItem.model_validate(b)


@router.post("", response_model=CompanyBranchResponse, status_code=201)
async def create_branch(
    company_id: str,
    body: CompanyBranchCreateRequest,
    branch_svc: Annotated[CompanyBranchService, Depends(get_company_branch_service)],
):
    """Create a branch for a company. Requires X-Tenant-ID header."""
    data = CompanyBranchCreate(
        company_id=company_id,
        name=body.name,
        address=body.address,
        phone=body.phone,
    )
    created = await branch_svc.create_branch(data)
    return _to_response(created)


@router.get("", response_model=list[CompanyBranchListItem])
async def list_branches(
    company_id: str,
    branch_svc: Annotated[CompanyBranchService, Depends(get_company_branch_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List branches for a company. Requires X-Tenant-ID."""
    items = await branch_svc.list_by_company(company_id=company_id, skip=skip, limit=limit)
    return [_to_list_item(b) for b in items]


@router.get("/{branch_id}", response_model=CompanyBranchResponse)
async def get_branch(
    company_id: str,
    branch_id: str,
    branch_svc: Annotated[CompanyBranchService, Depends(get_company_branch_service)],
):
    """Get branch by ID. Requires X-Tenant-ID."""
    branch = await branch_svc.get_by_id(branch_id)
    if branch.company_id != company_id:
        raise HTTPException(status_code=404, detail="Branch not found")
    return _to_response(branch)


@router.patch("/{branch_id}", response_model=CompanyBranchResponse)
async def update_branch(
    company_id: str,
    branch_id: str,
    body: CompanyBranchUpdateRequest,
    branch_svc: Annotated[CompanyBranchService, Depends(get_company_branch_service)],
):
    """Update a branch. Requires X-Tenant-ID."""
    branch = await branch_svc.get_by_id(branch_id)
    if branch.company_id != company_id:
        raise HTTPException(status_code=404, detail="Branch not found")
    data = CompanyBranchUpdate(name=body.name, address=body.address, phone=body.phone)
    updated = await branch_svc.update_branch(branch_id, data)
    return _to_response(updated)
