"""Insurance type service. Tenant-scoped CRUD."""

from app.application.dtos.reference_data import (
    InsuranceTypeCreate,
    InsuranceTypeResult,
    InsuranceTypeUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.insurance_type_repo import (
    InsuranceTypeRepository,
)


class InsuranceTypeService:
    def __init__(self, repo: InsuranceTypeRepository) -> None:
        self.repo = repo

    async def create(self, data: InsuranceTypeCreate) -> InsuranceTypeResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Name is required", field="name")
        return await self.repo.create(data)

    async def get_by_id(self, entity_id: str) -> InsuranceTypeResult:
        r = await self.repo.get_by_id(entity_id)
        if not r:
            raise ResourceNotFoundException("Insurance type not found")
        return r

    async def list(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[InsuranceTypeResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit, status=status)

    async def update(
        self, entity_id: str, data: InsuranceTypeUpdate
    ) -> InsuranceTypeResult:
        updated = await self.repo.update(entity_id, data)
        if not updated:
            raise ResourceNotFoundException("Insurance type not found")
        return updated
