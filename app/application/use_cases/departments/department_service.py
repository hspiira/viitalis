"""Department service. Tenant-scoped CRUD."""

from app.application.dtos.reference_data import (
    DepartmentCreate,
    DepartmentResult,
    DepartmentUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.department_repo import (
    DepartmentRepository,
)


class DepartmentService:
    def __init__(self, repo: DepartmentRepository) -> None:
        self.repo = repo

    async def create(self, data: DepartmentCreate) -> DepartmentResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Name is required", field="name")
        return await self.repo.create(data)

    async def get_by_id(self, entity_id: str) -> DepartmentResult:
        r = await self.repo.get_by_id(entity_id)
        if not r:
            raise ResourceNotFoundException("Department not found")
        return r

    async def list(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[DepartmentResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit, status=status)

    async def update(
        self, entity_id: str, data: DepartmentUpdate
    ) -> DepartmentResult:
        updated = await self.repo.update(entity_id, data)
        if not updated:
            raise ResourceNotFoundException("Department not found")
        return updated
