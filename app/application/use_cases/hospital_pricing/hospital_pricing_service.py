"""Hospital pricing service: list/create for medicines, services, labs. Tenant-scoped."""

from app.application.dtos.hospital_pricing import (
    HospitalLabTestCreate,
    HospitalLabTestResult,
    HospitalMedicineCreate,
    HospitalMedicineResult,
    HospitalServicePriceCreate,
    HospitalServicePriceResult,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.hospital_pricing_repo import (
    HospitalPricingRepository,
)


class HospitalPricingService:
    def __init__(self, repo: HospitalPricingRepository) -> None:
        self.repo = repo

    async def list_medicines(
        self, hospital_id: str, skip: int = 0, limit: int = 100
    ) -> list[HospitalMedicineResult]:
        return await self.repo.list_medicines_by_hospital(
            hospital_id, skip=skip, limit=limit
        )

    async def create_medicine(
        self, hospital_id: str, data: HospitalMedicineCreate
    ) -> HospitalMedicineResult:
        if data.unit_price < 0:
            raise ValidationException("Unit price must be non-negative", field="unit_price")
        data = HospitalMedicineCreate(
            hospital_id=hospital_id,
            medicine_id=data.medicine_id,
            unit_price=data.unit_price,
            effective_date=data.effective_date,
            status=data.status,
        )
        return await self.repo.create_hospital_medicine(data)

    async def get_medicine(self, id: str) -> HospitalMedicineResult:
        r = await self.repo.get_hospital_medicine(id)
        if not r:
            raise ResourceNotFoundException("Hospital medicine not found")
        return r

    async def list_services(
        self, hospital_id: str, skip: int = 0, limit: int = 100
    ) -> list[HospitalServicePriceResult]:
        return await self.repo.list_services_by_hospital(
            hospital_id, skip=skip, limit=limit
        )

    async def create_service(
        self, hospital_id: str, data: HospitalServicePriceCreate
    ) -> HospitalServicePriceResult:
        if data.amount < 0:
            raise ValidationException("Amount must be non-negative", field="amount")
        data = HospitalServicePriceCreate(
            hospital_id=hospital_id,
            service_id=data.service_id,
            amount=data.amount,
            effective_date=data.effective_date,
            status=data.status,
        )
        return await self.repo.create_hospital_service(data)

    async def get_service(self, id: str) -> HospitalServicePriceResult:
        r = await self.repo.get_hospital_service(id)
        if not r:
            raise ResourceNotFoundException("Hospital service price not found")
        return r

    async def list_labs(
        self, hospital_id: str, skip: int = 0, limit: int = 100
    ) -> list[HospitalLabTestResult]:
        return await self.repo.list_labs_by_hospital(
            hospital_id, skip=skip, limit=limit
        )

    async def create_lab_test(
        self, hospital_id: str, data: HospitalLabTestCreate
    ) -> HospitalLabTestResult:
        if data.amount < 0:
            raise ValidationException("Amount must be non-negative", field="amount")
        data = HospitalLabTestCreate(
            hospital_id=hospital_id,
            lab_id=data.lab_id,
            amount=data.amount,
            effective_date=data.effective_date,
            status=data.status,
        )
        return await self.repo.create_hospital_lab_test(data)

    async def get_lab_test(self, id: str) -> HospitalLabTestResult:
        r = await self.repo.get_hospital_lab_test(id)
        if not r:
            raise ResourceNotFoundException("Hospital lab test not found")
        return r
