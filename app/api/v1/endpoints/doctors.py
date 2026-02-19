"""Doctors API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_doctor_service
from app.application.dtos.doctor import DoctorCreate, DoctorUpdate
from app.application.use_cases.doctors import DoctorService
from app.schemas.doctor import (
    DoctorCreateRequest,
    DoctorResponse,
    DoctorUpdateRequest,
)

router = APIRouter()


@router.post("", response_model=DoctorResponse, status_code=201)
async def create_doctor(
    body: DoctorCreateRequest,
    svc: Annotated[DoctorService, Depends(get_doctor_service)],
):
    data = DoctorCreate(
        hospital_id=body.hospital_id,
        name=body.name,
        specialization=body.specialization,
    )
    created = await svc.create(data)
    return DoctorResponse(
        id=created.id,
        tenant_id=created.tenant_id,
        hospital_id=created.hospital_id,
        name=created.name,
        specialization=created.specialization,
    )


@router.get("", response_model=list[DoctorResponse])
async def list_doctors(
    svc: Annotated[DoctorService, Depends(get_doctor_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    hospital_id: str | None = Query(None),
):
    items = await svc.list_doctors(
        skip=skip, limit=limit, hospital_id=hospital_id
    )
    return [
        DoctorResponse(
            id=d.id,
            tenant_id=d.tenant_id,
            hospital_id=d.hospital_id,
            name=d.name,
            specialization=d.specialization,
        )
        for d in items
    ]


@router.get("/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(
    doctor_id: str,
    svc: Annotated[DoctorService, Depends(get_doctor_service)],
):
    d = await svc.get_by_id(doctor_id)
    return DoctorResponse(
        id=d.id,
        tenant_id=d.tenant_id,
        hospital_id=d.hospital_id,
        name=d.name,
        specialization=d.specialization,
    )


@router.patch("/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(
    doctor_id: str,
    body: DoctorUpdateRequest,
    svc: Annotated[DoctorService, Depends(get_doctor_service)],
):
    data = DoctorUpdate(name=body.name, specialization=body.specialization)
    updated = await svc.update(doctor_id, data)
    return DoctorResponse(
        id=updated.id,
        tenant_id=updated.tenant_id,
        hospital_id=updated.hospital_id,
        name=updated.name,
        specialization=updated.specialization,
    )
