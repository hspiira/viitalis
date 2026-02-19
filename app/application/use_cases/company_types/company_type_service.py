"""Company type service. Tenant-scoped CRUD."""

from app.application.dtos.reference_data import (
    CompanyTypeCreate,
    CompanyTypeResult,
    CompanyTypeUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.company_type_repo import (
    CompanyTypeRepository,
)


class CompanyTypeService:
    def __init__(self, repo: CompanyTypeRepository) -> None:
        self.repo = repo

    async def create(self, data: CompanyTypeCreate) -> CompanyTypeResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Name is required", field="name")
        return await self.repo.create(data)

    async def get_by_id(self, entity_id: str) -> CompanyTypeResult:
        r = await self.repo.get_by_id(entity_id)
        if not r:
            raise ResourceNotFoundException("Company type not found")
        return r

    async def list(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[CompanyTypeResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit, status=status)

    async def update(
        self, entity_id: str, data: CompanyTypeUpdate
    ) -> CompanyTypeResult:
        updated = await self.repo.update(entity_id, data)
        if not updated:
            raise ResourceNotFoundException("Company type not found")
        return updated
