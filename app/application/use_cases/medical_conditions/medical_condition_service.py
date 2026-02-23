"""Medical condition service. Tenant-scoped CRUD."""

from app.application.dtos.reference_data import (
    MedicalConditionCreate,
    MedicalConditionResult,
    MedicalConditionUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.medical_condition_repo import (
    MedicalConditionRepository,
)


class MedicalConditionService:
    def __init__(self, repo: MedicalConditionRepository) -> None:
        self.repo = repo

    async def create(
        self, data: MedicalConditionCreate
    ) -> MedicalConditionResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Name is required", field="name")
        return await self.repo.create(data)

    async def get_by_id(self, entity_id: str) -> MedicalConditionResult:
        r = await self.repo.get_by_id(entity_id)
        if not r:
            raise ResourceNotFoundException("Medical condition not found")
        return r

    async def list(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[MedicalConditionResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit, status=status)

    async def update(
        self, entity_id: str, data: MedicalConditionUpdate
    ) -> MedicalConditionResult:
        updated = await self.repo.update(entity_id, data)
        if not updated:
            raise ResourceNotFoundException("Medical condition not found")
        return updated
