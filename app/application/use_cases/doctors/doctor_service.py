"""Doctor service: CRUD. Tenant-scoped."""

from app.application.dtos.doctor import DoctorCreate, DoctorResult, DoctorUpdate
from app.domain.exceptions import ResourceNotFoundException, ValidationException


class DoctorService:
    def __init__(self, doctor_repo) -> None:
        self.repo = doctor_repo

    async def create(self, data: DoctorCreate) -> DoctorResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Doctor name is required", field="name")
        if not data.hospital_id or not data.hospital_id.strip():
            raise ValidationException("Doctor must belong to a hospital", field="hospital_id")
        return await self.repo.create(data)

    async def get_by_id(self, doctor_id: str) -> DoctorResult:
        d = await self.repo.get_by_id(doctor_id)
        if not d:
            raise ResourceNotFoundException("Doctor not found")
        return d

    async def list_doctors(
        self, skip: int = 0, limit: int = 100, hospital_id: str | None = None
    ) -> list[DoctorResult]:
        return await self.repo.list_by_tenant(
            skip=skip, limit=limit, hospital_id=hospital_id
        )

    async def update(self, doctor_id: str, data: DoctorUpdate) -> DoctorResult:
        updated = await self.repo.update(doctor_id, data)
        if not updated:
            raise ResourceNotFoundException("Doctor not found")
        return updated
