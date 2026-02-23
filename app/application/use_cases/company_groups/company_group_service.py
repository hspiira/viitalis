"""Company group service. Tenant-scoped CRUD."""

from app.application.dtos.reference_data import (
    CompanyGroupCreate,
    CompanyGroupResult,
    CompanyGroupUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.company_group_repo import (
    CompanyGroupRepository,
)


class CompanyGroupService:
    def __init__(self, repo: CompanyGroupRepository) -> None:
        self.repo = repo

    async def create(self, data: CompanyGroupCreate) -> CompanyGroupResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Name is required", field="name")
        return await self.repo.create(data)

    async def get_by_id(self, entity_id: str) -> CompanyGroupResult:
        r = await self.repo.get_by_id(entity_id)
        if not r:
            raise ResourceNotFoundException("Company group not found")
        return r

    async def list(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[CompanyGroupResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit, status=status)

    async def update(
        self, entity_id: str, data: CompanyGroupUpdate
    ) -> CompanyGroupResult:
        updated = await self.repo.update(entity_id, data)
        if not updated:
            raise ResourceNotFoundException("Company group not found")
        return updated
