"""Hospital and hospital branches API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.v1.dependencies import (
    get_hospital_branch_service,
    get_hospital_service,
)
from app.application.dtos.hospital import (
    HospitalBranchCreate,
    HospitalBranchUpdate,
    HospitalCreate,
    HospitalUpdate,
)
from app.application.use_cases.hospitals import HospitalBranchService, HospitalService
from app.schemas.hospital import (
    HospitalBranchCreateRequest,
    HospitalBranchResponse,
    HospitalBranchUpdateRequest,
    HospitalCreateRequest,
    HospitalResponse,
    HospitalUpdateRequest,
)

router = APIRouter()


# --- Hospitals ---
@router.post("", response_model=HospitalResponse, status_code=201)
async def create_hospital(
    body: HospitalCreateRequest,
    svc: Annotated[HospitalService, Depends(get_hospital_service)],
):
    data = HospitalCreate(name=body.name, address=body.address)
    created = await svc.create(data)
    return HospitalResponse(
        id=created.id, tenant_id=created.tenant_id, name=created.name, address=created.address
    )


@router.get("", response_model=list[HospitalResponse])
async def list_hospitals(
    svc: Annotated[HospitalService, Depends(get_hospital_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    items = await svc.list_hospitals(skip=skip, limit=limit)
    return [
        HospitalResponse(id=h.id, tenant_id=h.tenant_id, name=h.name, address=h.address)
        for h in items
    ]


@router.get("/{hospital_id}", response_model=HospitalResponse)
async def get_hospital(
    hospital_id: str,
    svc: Annotated[HospitalService, Depends(get_hospital_service)],
):
    h = await svc.get_by_id(hospital_id)
    return HospitalResponse(id=h.id, tenant_id=h.tenant_id, name=h.name, address=h.address)


@router.patch("/{hospital_id}", response_model=HospitalResponse)
async def update_hospital(
    hospital_id: str,
    body: HospitalUpdateRequest,
    svc: Annotated[HospitalService, Depends(get_hospital_service)],
):
    data = HospitalUpdate(name=body.name, address=body.address)
    updated = await svc.update(hospital_id, data)
    return HospitalResponse(
        id=updated.id, tenant_id=updated.tenant_id, name=updated.name, address=updated.address
    )


# --- Branches (nested under /hospitals/{hospital_id}/branches) ---
@router.post("/{hospital_id}/branches", response_model=HospitalBranchResponse, status_code=201)
async def create_branch(
    hospital_id: str,
    body: HospitalBranchCreateRequest,
    svc: Annotated[HospitalBranchService, Depends(get_hospital_branch_service)],
):
    data = HospitalBranchCreate(hospital_id=hospital_id, name=body.name, address=body.address)
    created = await svc.create(data)
    return HospitalBranchResponse(
        id=created.id,
        tenant_id=created.tenant_id,
        hospital_id=created.hospital_id,
        name=created.name,
        address=created.address,
    )


@router.get("/{hospital_id}/branches", response_model=list[HospitalBranchResponse])
async def list_branches(
    hospital_id: str,
    svc: Annotated[HospitalBranchService, Depends(get_hospital_branch_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    items = await svc.list_by_hospital(hospital_id=hospital_id, skip=skip, limit=limit)
    return [
        HospitalBranchResponse(
            id=b.id,
            tenant_id=b.tenant_id,
            hospital_id=b.hospital_id,
            name=b.name,
            address=b.address,
        )
        for b in items
    ]


@router.get("/{hospital_id}/branches/{branch_id}", response_model=HospitalBranchResponse)
async def get_branch(
    hospital_id: str,
    branch_id: str,
    svc: Annotated[HospitalBranchService, Depends(get_hospital_branch_service)],
):
    b = await svc.get_by_id(branch_id)
    if b.hospital_id != hospital_id:
        raise HTTPException(status_code=404, detail="Branch not found")
    return HospitalBranchResponse(
        id=b.id, tenant_id=b.tenant_id, hospital_id=b.hospital_id, name=b.name, address=b.address
    )


@router.patch("/{hospital_id}/branches/{branch_id}", response_model=HospitalBranchResponse)
async def update_branch(
    hospital_id: str,
    branch_id: str,
    body: HospitalBranchUpdateRequest,
    svc: Annotated[HospitalBranchService, Depends(get_hospital_branch_service)],
):
    b = await svc.get_by_id(branch_id)
    if b.hospital_id != hospital_id:
        raise HTTPException(status_code=404, detail="Branch not found")
    data = HospitalBranchUpdate(name=body.name, address=body.address)
    updated = await svc.update(branch_id, data)
    return HospitalBranchResponse(
        id=updated.id,
        tenant_id=updated.tenant_id,
        hospital_id=updated.hospital_id,
        name=updated.name,
        address=updated.address,
    )
