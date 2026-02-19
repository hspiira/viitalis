"""Card replacement service. Request replacement (member or dependant)."""

from app.application.dtos.card_replacement import (
    CardReplacementCreate,
    CardReplacementResult,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.card_replacement_repo import (
    CardReplacementRepository,
)
from app.infrastructure.persistence.repositories.card_replacement_reason_repo import (
    CardReplacementReasonRepository,
)


class CardReplacementService:
    def __init__(
        self,
        repo: CardReplacementRepository,
        reason_repo: CardReplacementReasonRepository,
    ) -> None:
        self.repo = repo
        self.reason_repo = reason_repo

    async def create(self, data: CardReplacementCreate) -> CardReplacementResult:
        if not data.reason_id or not data.reason_id.strip():
            raise ValidationException("reason_id is required", field="reason_id")
        if data.member_id and data.dependant_id:
            raise ValidationException(
                "Provide either member_id or dependant_id, not both",
                field="member_id",
            )
        if not data.member_id and not data.dependant_id:
            raise ValidationException(
                "Either member_id or dependant_id is required",
                field="member_id",
            )
        reason = await self.reason_repo.get_by_id(data.reason_id)
        if not reason:
            raise ResourceNotFoundException("Card replacement reason not found")
        return await self.repo.create(data)

    async def get_by_id(self, entity_id: str) -> CardReplacementResult:
        r = await self.repo.get_by_id(entity_id)
        if not r:
            raise ResourceNotFoundException("Card replacement not found")
        return r

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        member_id: str | None = None,
        dependant_id: str | None = None,
        status: str | None = None,
    ) -> list[CardReplacementResult]:
        return await self.repo.list_by_tenant(
            skip=skip,
            limit=limit,
            member_id=member_id,
            dependant_id=dependant_id,
            status=status,
        )
