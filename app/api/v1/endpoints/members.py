"""Member API: create, list, get, update, soft-delete. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_member_service
from app.application.dtos.member import MemberCreate, MemberUpdate
from app.application.use_cases.members import MemberService
from app.schemas.member import (
    MemberCreateRequest,
    MemberListItem,
    MemberResponse,
    MemberUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> MemberResponse:
    return MemberResponse(
        id=r.id,
        tenant_id=r.tenant_id,
        company_id=r.company_id,
        scheme_id=r.scheme_id,
        card_no=r.card_no,
        name=r.name,
        dob=r.dob,
        status=r.status,
    )


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
    return [
        MemberListItem(
            id=m.id,
            tenant_id=m.tenant_id,
            company_id=m.company_id,
            scheme_id=m.scheme_id,
            card_no=m.card_no,
            name=m.name,
            dob=m.dob,
            status=m.status,
        )
        for m in items
    ]


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
