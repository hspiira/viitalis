"""Member dependants API under /members/{member_id}/dependants. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.v1.dependencies import get_member_dependant_service
from app.application.dtos.member_dependant import (
    MemberDependantCreate,
    MemberDependantUpdate,
)
from app.application.use_cases.member_dependants import MemberDependantService
from app.schemas.member_dependant import (
    MemberDependantCreateRequest,
    MemberDependantListItem,
    MemberDependantResponse,
    MemberDependantUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> MemberDependantResponse:
    return MemberDependantResponse(
        id=r.id,
        tenant_id=r.tenant_id,
        member_id=r.member_id,
        name=r.name,
        dob=r.dob,
    )


@router.post("", response_model=MemberDependantResponse, status_code=201)
async def create_dependant(
    member_id: str,
    body: MemberDependantCreateRequest,
    dep_svc: Annotated[MemberDependantService, Depends(get_member_dependant_service)],
):
    """Create a dependant for a member. Requires X-Tenant-ID header."""
    data = MemberDependantCreate(
        member_id=member_id,
        name=body.name,
        dob=body.dob,
    )
    created = await dep_svc.create_dependant(data)
    return _to_response(created)


@router.get("", response_model=list[MemberDependantListItem])
async def list_dependants(
    member_id: str,
    dep_svc: Annotated[MemberDependantService, Depends(get_member_dependant_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List dependants for a member. Requires X-Tenant-ID."""
    items = await dep_svc.list_by_member(member_id=member_id, skip=skip, limit=limit)
    return [
        MemberDependantListItem(
            id=d.id,
            tenant_id=d.tenant_id,
            member_id=d.member_id,
            name=d.name,
            dob=d.dob,
        )
        for d in items
    ]


@router.get("/{dependant_id}", response_model=MemberDependantResponse)
async def get_dependant(
    member_id: str,
    dependant_id: str,
    dep_svc: Annotated[MemberDependantService, Depends(get_member_dependant_service)],
):
    """Get dependant by ID. Requires X-Tenant-ID."""
    dep = await dep_svc.get_by_id(dependant_id)
    if dep.member_id != member_id:
        raise HTTPException(status_code=404, detail="Dependant not found")
    return _to_response(dep)


@router.patch("/{dependant_id}", response_model=MemberDependantResponse)
async def update_dependant(
    member_id: str,
    dependant_id: str,
    body: MemberDependantUpdateRequest,
    dep_svc: Annotated[MemberDependantService, Depends(get_member_dependant_service)],
):
    """Update a dependant. Requires X-Tenant-ID."""
    dep = await dep_svc.get_by_id(dependant_id)
    if dep.member_id != member_id:
        raise HTTPException(status_code=404, detail="Dependant not found")
    data = MemberDependantUpdate(name=body.name, dob=body.dob)
    updated = await dep_svc.update_dependant(dependant_id, data)
    return _to_response(updated)


@router.delete("/{dependant_id}", status_code=204)
async def delete_dependant(
    member_id: str,
    dependant_id: str,
    dep_svc: Annotated[MemberDependantService, Depends(get_member_dependant_service)],
):
    """Soft-delete a dependant. Requires X-Tenant-ID."""
    dep = await dep_svc.get_by_id(dependant_id)
    if dep.member_id != member_id:
        raise HTTPException(status_code=404, detail="Dependant not found")
    await dep_svc.soft_delete_dependant(dependant_id)
