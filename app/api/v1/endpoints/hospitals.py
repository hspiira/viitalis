"""Hospital and hospital branches API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.v1.dependencies import (
    get_hospital_branch_service,
    get_hospital_pricing_service,
    get_hospital_service,
)
from app.application.dtos.hospital import (
    HospitalBranchCreate,
    HospitalBranchUpdate,
    HospitalCreate,
    HospitalUpdate,
)
from app.application.dtos.hospital_pricing import (
    HospitalLabTestCreate,
    HospitalMedicineCreate,
    HospitalServicePriceCreate,
)
from app.application.use_cases.hospital_pricing import HospitalPricingService
from app.application.use_cases.hospitals import HospitalBranchService, HospitalService
from app.schemas.hospital import (
    HospitalBranchCreateRequest,
    HospitalBranchResponse,
    HospitalBranchUpdateRequest,
    HospitalCreateRequest,
    HospitalResponse,
    HospitalUpdateRequest,
)
from app.schemas.hospital_pricing import (
    HospitalLabTestCreateRequest,
    HospitalLabTestResponse,
    HospitalMedicineCreateRequest,
    HospitalMedicineResponse,
    HospitalServicePriceCreateRequest,
    HospitalServicePriceResponse,
)

router = APIRouter()


def _hospital_to_response(h) -> HospitalResponse:
    """Map HospitalResult DTO to API response (DRY)."""
    return HospitalResponse.model_validate(h)


def _branch_to_response(b) -> HospitalBranchResponse:
    """Map HospitalBranchResult DTO to API response (DRY)."""
    return HospitalBranchResponse.model_validate(b)


# --- Hospitals ---
@router.post("", response_model=HospitalResponse, status_code=201)
async def create_hospital(
    body: HospitalCreateRequest,
    svc: Annotated[HospitalService, Depends(get_hospital_service)],
):
    data = HospitalCreate(
        name=body.name,
        address=body.address,
        code=body.code,
        reference=body.reference,
        contact_person=body.contact_person,
        phone=body.phone,
        email=body.email,
        website=body.website,
        remarks=body.remarks,
        district_id=body.district_id,
        outpatient_capacity=body.outpatient_capacity,
        inpatient_capacity=body.inpatient_capacity,
        out_or_in_patient=body.out_or_in_patient,
        dental=body.dental,
        status=body.status,
    )
    created = await svc.create(data)
    return _hospital_to_response(created)


@router.get("", response_model=list[HospitalResponse])
async def list_hospitals(
    svc: Annotated[HospitalService, Depends(get_hospital_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    items = await svc.list_hospitals(skip=skip, limit=limit)
    return [_hospital_to_response(h) for h in items]


@router.get("/{hospital_id}", response_model=HospitalResponse)
async def get_hospital(
    hospital_id: str,
    svc: Annotated[HospitalService, Depends(get_hospital_service)],
):
    h = await svc.get_by_id(hospital_id)
    return _hospital_to_response(h)


@router.patch("/{hospital_id}", response_model=HospitalResponse)
async def update_hospital(
    hospital_id: str,
    body: HospitalUpdateRequest,
    svc: Annotated[HospitalService, Depends(get_hospital_service)],
):
    data = HospitalUpdate(name=body.name, address=body.address)
    updated = await svc.update(hospital_id, data)
    return _hospital_to_response(updated)


@router.delete("/{hospital_id}", status_code=204)
async def delete_hospital(
    hospital_id: str,
    svc: Annotated[HospitalService, Depends(get_hospital_service)],
):
    """Delete a hospital. Fails if it has claims. Requires X-Tenant-ID."""
    await svc.delete(hospital_id)


# --- Hospital pricing (medicines, services, labs) ---
@router.get("/{hospital_id}/medicines", response_model=list[HospitalMedicineResponse])
async def list_hospital_medicines(
    hospital_id: str,
    pricing_svc: Annotated[HospitalPricingService, Depends(get_hospital_pricing_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    items = await pricing_svc.list_medicines(hospital_id, skip=skip, limit=limit)
    return [HospitalMedicineResponse.model_validate(x) for x in items]


@router.post("/{hospital_id}/medicines", response_model=HospitalMedicineResponse, status_code=201)
async def create_hospital_medicine(
    hospital_id: str,
    body: HospitalMedicineCreateRequest,
    hospital_svc: Annotated[HospitalService, Depends(get_hospital_service)],
    pricing_svc: Annotated[HospitalPricingService, Depends(get_hospital_pricing_service)],
):
    await hospital_svc.get_by_id(hospital_id)
    data = HospitalMedicineCreate(
        hospital_id=hospital_id,
        medicine_id=body.medicine_id,
        unit_price=body.unit_price,
        effective_date=body.effective_date,
        status=body.status,
    )
    created = await pricing_svc.create_medicine(hospital_id, data)
    return HospitalMedicineResponse.model_validate(created)


@router.get("/{hospital_id}/medicines/{pricing_id}", response_model=HospitalMedicineResponse)
async def get_hospital_medicine(
    hospital_id: str,
    pricing_id: str,
    pricing_svc: Annotated[HospitalPricingService, Depends(get_hospital_pricing_service)],
):
    r = await pricing_svc.get_medicine(pricing_id)
    if r.hospital_id != hospital_id:
        raise HTTPException(status_code=404, detail="Not found")
    return HospitalMedicineResponse.model_validate(r)


@router.get("/{hospital_id}/services", response_model=list[HospitalServicePriceResponse])
async def list_hospital_services(
    hospital_id: str,
    pricing_svc: Annotated[HospitalPricingService, Depends(get_hospital_pricing_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    items = await pricing_svc.list_services(hospital_id, skip=skip, limit=limit)
    return [HospitalServicePriceResponse.model_validate(x) for x in items]


@router.post("/{hospital_id}/services", response_model=HospitalServicePriceResponse, status_code=201)
async def create_hospital_service(
    hospital_id: str,
    body: HospitalServicePriceCreateRequest,
    hospital_svc: Annotated[HospitalService, Depends(get_hospital_service)],
    pricing_svc: Annotated[HospitalPricingService, Depends(get_hospital_pricing_service)],
):
    await hospital_svc.get_by_id(hospital_id)
    data = HospitalServicePriceCreate(
        hospital_id=hospital_id,
        service_id=body.service_id,
        amount=body.amount,
        effective_date=body.effective_date,
        status=body.status,
    )
    created = await pricing_svc.create_service(hospital_id, data)
    return HospitalServicePriceResponse.model_validate(created)


@router.get("/{hospital_id}/services/{pricing_id}", response_model=HospitalServicePriceResponse)
async def get_hospital_service_price(
    hospital_id: str,
    pricing_id: str,
    pricing_svc: Annotated[HospitalPricingService, Depends(get_hospital_pricing_service)],
):
    r = await pricing_svc.get_service(pricing_id)
    if r.hospital_id != hospital_id:
        raise HTTPException(status_code=404, detail="Not found")
    return HospitalServicePriceResponse.model_validate(r)


@router.get("/{hospital_id}/labs", response_model=list[HospitalLabTestResponse])
async def list_hospital_labs(
    hospital_id: str,
    pricing_svc: Annotated[HospitalPricingService, Depends(get_hospital_pricing_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    items = await pricing_svc.list_labs(hospital_id, skip=skip, limit=limit)
    return [HospitalLabTestResponse.model_validate(x) for x in items]


@router.post("/{hospital_id}/labs", response_model=HospitalLabTestResponse, status_code=201)
async def create_hospital_lab_test(
    hospital_id: str,
    body: HospitalLabTestCreateRequest,
    hospital_svc: Annotated[HospitalService, Depends(get_hospital_service)],
    pricing_svc: Annotated[HospitalPricingService, Depends(get_hospital_pricing_service)],
):
    await hospital_svc.get_by_id(hospital_id)
    data = HospitalLabTestCreate(
        hospital_id=hospital_id,
        lab_id=body.lab_id,
        amount=body.amount,
        effective_date=body.effective_date,
        status=body.status,
    )
    created = await pricing_svc.create_lab_test(hospital_id, data)
    return HospitalLabTestResponse.model_validate(created)


@router.get("/{hospital_id}/labs/{pricing_id}", response_model=HospitalLabTestResponse)
async def get_hospital_lab_test(
    hospital_id: str,
    pricing_id: str,
    pricing_svc: Annotated[HospitalPricingService, Depends(get_hospital_pricing_service)],
):
    r = await pricing_svc.get_lab_test(pricing_id)
    if r.hospital_id != hospital_id:
        raise HTTPException(status_code=404, detail="Not found")
    return HospitalLabTestResponse.model_validate(r)


# --- Branches (nested under /hospitals/{hospital_id}/branches) ---
@router.post("/{hospital_id}/branches", response_model=HospitalBranchResponse, status_code=201)
async def create_branch(
    hospital_id: str,
    body: HospitalBranchCreateRequest,
    svc: Annotated[HospitalBranchService, Depends(get_hospital_branch_service)],
):
    data = HospitalBranchCreate(
        hospital_id=hospital_id,
        name=body.name,
        address=body.address,
        contact_person=body.contact_person,
        location=body.location,
        remarks=body.remarks,
    )
    created = await svc.create(data)
    return _branch_to_response(created)


@router.get("/{hospital_id}/branches", response_model=list[HospitalBranchResponse])
async def list_branches(
    hospital_id: str,
    svc: Annotated[HospitalBranchService, Depends(get_hospital_branch_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    items = await svc.list_by_hospital(hospital_id=hospital_id, skip=skip, limit=limit)
    return [_branch_to_response(b) for b in items]


@router.get("/{hospital_id}/branches/{branch_id}", response_model=HospitalBranchResponse)
async def get_branch(
    hospital_id: str,
    branch_id: str,
    svc: Annotated[HospitalBranchService, Depends(get_hospital_branch_service)],
):
    b = await svc.get_by_id(branch_id)
    if b.hospital_id != hospital_id:
        raise HTTPException(status_code=404, detail="Branch not found")
    return _branch_to_response(b)


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
    data = HospitalBranchUpdate(
        name=body.name,
        address=body.address,
        contact_person=body.contact_person,
        location=body.location,
        remarks=body.remarks,
    )
    updated = await svc.update(branch_id, data)
    return _branch_to_response(updated)
