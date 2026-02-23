"""Card replacement reason service. Tenant-scoped CRUD."""

from app.application.dtos.card_replacement import (
    CardReplacementReasonCreate,
    CardReplacementReasonResult,
    CardReplacementReasonUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.card_replacement_reason_repo import (
    CardReplacementReasonRepository,
)


class CardReplacementReasonService:
    def __init__(self, repo: CardReplacementReasonRepository) -> None:
        self.repo = repo

    async def create(self, data: CardReplacementReasonCreate) -> CardReplacementReasonResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Name is required", field="name")
        return await self.repo.create(data)

    async def get_by_id(self, entity_id: str) -> CardReplacementReasonResult:
        r = await self.repo.get_by_id(entity_id)
        if not r:
            raise ResourceNotFoundException("Card replacement reason not found")
        return r

    async def list(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[CardReplacementReasonResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit, status=status)

    async def update(
        self, entity_id: str, data: CardReplacementReasonUpdate
    ) -> CardReplacementReasonResult:
        updated = await self.repo.update(entity_id, data)
        if not updated:
            raise ResourceNotFoundException("Card replacement reason not found")
        return updated
