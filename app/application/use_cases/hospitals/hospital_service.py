"""Hospital service: CRUD. Tenant-scoped."""

from __future__ import annotations

from app.application.dtos.hospital import HospitalCreate, HospitalResult, HospitalUpdate
from app.domain.exceptions import ResourceNotFoundException, ValidationException


class HospitalService:
    def __init__(self, hospital_repo) -> None:
        self.repo = hospital_repo

    async def create(self, data: HospitalCreate) -> HospitalResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Hospital name is required", field="name")
        return await self.repo.create(data)

    async def get_by_id(self, hospital_id: str) -> HospitalResult:
        h = await self.repo.get_by_id(hospital_id)
        if not h:
            raise ResourceNotFoundException("Hospital not found")
        return h

    async def list_hospitals(self, skip: int = 0, limit: int = 100) -> list[HospitalResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit)

    async def update(self, hospital_id: str, data: HospitalUpdate) -> HospitalResult:
        updated = await self.repo.update(hospital_id, data)
        if not updated:
            raise ResourceNotFoundException("Hospital not found")
        return updated
