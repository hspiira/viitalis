"""Financial period service. Tenant-scoped CRUD."""

from app.application.dtos.reference_data import (
    FinancialPeriodCreate,
    FinancialPeriodResult,
    FinancialPeriodUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.financial_period_repo import (
    FinancialPeriodRepository,
)


class FinancialPeriodService:
    def __init__(self, repo: FinancialPeriodRepository) -> None:
        self.repo = repo

    async def create(self, data: FinancialPeriodCreate) -> FinancialPeriodResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Name is required", field="name")
        if data.start_date > data.end_date:
            raise ValidationException(
                "start_date must be before or equal to end_date",
                field="start_date",
            )
        return await self.repo.create(data)

    async def get_by_id(self, entity_id: str) -> FinancialPeriodResult:
        r = await self.repo.get_by_id(entity_id)
        if not r:
            raise ResourceNotFoundException("Financial period not found")
        return r

    async def list(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[FinancialPeriodResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit, status=status)

    async def update(
        self, entity_id: str, data: FinancialPeriodUpdate
    ) -> FinancialPeriodResult:
        if data.start_date is not None and data.end_date is not None:
            if data.start_date > data.end_date:
                raise ValidationException(
                    "start_date must be before or equal to end_date",
                    field="start_date",
                )
        updated = await self.repo.update(entity_id, data)
        if not updated:
            raise ResourceNotFoundException("Financial period not found")
        return updated
