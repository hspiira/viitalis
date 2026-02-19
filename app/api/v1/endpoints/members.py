"""Member API: create, list, get, update, soft-delete. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_import_members_service, get_member_service
from app.application.dtos.member import MemberCreate, MemberUpdate
from app.application.use_cases.import_members import ImportMembersService
from app.application.use_cases.members import MemberService
from app.schemas.member import (
    MemberCreateRequest,
    MemberImportErrorItem,
    MemberImportRequest,
    MemberImportResponse,
    MemberListItem,
    MemberResponse,
    MemberUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> MemberResponse:
    """Map MemberResult DTO to API response (DRY)."""
    return MemberResponse.model_validate(r)


def _to_list_item(m) -> MemberListItem:
    """Map MemberResult to list item response (DRY)."""
    return MemberListItem.model_validate(m)


@router.post("", response_model=MemberResponse, status_code=201)
async def create_member(
    body: MemberCreateRequest,
    member_svc: Annotated[MemberService, Depends(get_member_service)],
):
    """Create a member. Requires X-Tenant-ID header."""
    data = MemberCreate(
        company_id=body.company_id,
        scheme_id=body.scheme_id,
        card_no=body.card_no,
        name=body.name,
        dob=body.dob,
        status=body.status,
    )
    created = await member_svc.create_member(data)
    return _to_response(created)


@router.post("/import", response_model=MemberImportResponse)
async def import_members(
    body: MemberImportRequest,
    import_svc: Annotated[ImportMembersService, Depends(get_import_members_service)],
):
    """Import members in batch (JSON). Validates company_id, scheme_id, card_no uniqueness. Max 500 per request. Requires X-Tenant-ID."""
    items = [
        MemberCreate(
            company_id=r.company_id,
            scheme_id=r.scheme_id,
            card_no=r.card_no,
            name=r.name,
            dob=r.dob,
            status=r.status,
        )
        for r in body.members
    ]
    created, failed, errors = await import_svc.import_members(items)
    return MemberImportResponse(
        created=created,
        failed=failed,
        errors=[MemberImportErrorItem(row=r, message=m) for r, m in errors],
    )


@router.get("", response_model=list[MemberListItem])
async def list_members(
    member_svc: Annotated[MemberService, Depends(get_member_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    company_id: str | None = Query(None),
    scheme_id: str | None = Query(None),
):
    """List members for the tenant (optional company_id, scheme_id). Requires X-Tenant-ID."""
    items = await member_svc.list_members(
        skip=skip, limit=limit, company_id=company_id, scheme_id=scheme_id
    )
    return [_to_list_item(m) for m in items]


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(
    member_id: str,
    member_svc: Annotated[MemberService, Depends(get_member_service)],
):
    """Get member by ID. Requires X-Tenant-ID."""
    member = await member_svc.get_by_id(member_id)
    return _to_response(member)


@router.patch("/{member_id}", response_model=MemberResponse)
async def update_member(
    member_id: str,
    body: MemberUpdateRequest,
    member_svc: Annotated[MemberService, Depends(get_member_service)],
):
    """Update a member. Requires X-Tenant-ID."""
    data = MemberUpdate(
        card_no=body.card_no,
        name=body.name,
        dob=body.dob,
        status=body.status,
    )
    updated = await member_svc.update_member(member_id, data)
    return _to_response(updated)


@router.delete("/{member_id}", status_code=204)
async def delete_member(
    member_id: str,
    member_svc: Annotated[MemberService, Depends(get_member_service)],
):
    """Soft-delete a member. Requires X-Tenant-ID."""
    await member_svc.soft_delete_member(member_id)
