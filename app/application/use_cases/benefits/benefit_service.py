"""Benefit service: CRUD for benefits. Tenant-scoped."""

from app.application.dtos.benefit import (
    BenefitCreate,
    BenefitResult,
    BenefitUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.benefit_repo import BenefitRepository


class BenefitService:
    def __init__(self, repo: BenefitRepository) -> None:
        self.repo = repo

    async def create_benefit(self, data: BenefitCreate) -> BenefitResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Benefit name is required", field="name")
        return await self.repo.create(data)

    async def get_by_id(self, benefit_id: str) -> BenefitResult:
        b = await self.repo.get_by_id(benefit_id)
        if not b:
            raise ResourceNotFoundException("Benefit not found")
        return b

    async def list_benefits(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[BenefitResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit, status=status)

    async def update_benefit(
        self, benefit_id: str, data: BenefitUpdate
    ) -> BenefitResult:
        updated = await self.repo.update(benefit_id, data)
        if not updated:
            raise ResourceNotFoundException("Benefit not found")
        return updated
