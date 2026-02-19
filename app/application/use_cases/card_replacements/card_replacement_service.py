"""Card replacement service. Request replacement (member or dependant), approve and update card_no."""

from app.application.dtos.card_replacement import (
    CardReplacementCreate,
    CardReplacementResult,
    CardReplacementUpdate,
)
from app.application.dtos.member import MemberUpdate
from app.application.dtos.member_dependant import MemberDependantUpdate
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.card_replacement_repo import (
    CardReplacementRepository,
)
from app.infrastructure.persistence.repositories.card_replacement_reason_repo import (
    CardReplacementReasonRepository,
)
from app.infrastructure.persistence.repositories.member_dependant_repo import (
    MemberDependantRepository,
)
from app.infrastructure.persistence.repositories.member_repo import MemberRepository


class CardReplacementService:
    def __init__(
        self,
        repo: CardReplacementRepository,
        reason_repo: CardReplacementReasonRepository,
        member_repo: MemberRepository,
        member_dependant_repo: MemberDependantRepository,
    ) -> None:
        self.repo = repo
        self.reason_repo = reason_repo
        self.member_repo = member_repo
        self.member_dependant_repo = member_dependant_repo

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

    async def approve_replacement(
        self,
        replacement_id: str,
        new_card_no_override: str | None = None,
    ) -> CardReplacementResult:
        """
        Approve a replacement: set status to 'approved', then update member or dependant
        card_no if new_card_no is set (from replacement record or override).
        """
        r = await self.repo.get_by_id(replacement_id)
        if not r:
            raise ResourceNotFoundException("Card replacement not found")
        if r.status != "requested":
            raise ValidationException(
                f"Only requested replacements can be approved (current status: {r.status})",
                field="status",
            )
        final_new_card = (new_card_no_override or r.new_card_no or "").strip()
        if final_new_card:
            if r.member_id:
                await self.member_repo.update(
                    r.member_id,
                    MemberUpdate(card_no=final_new_card),
                )
            elif r.dependant_id:
                await self.member_dependant_repo.update(
                    r.dependant_id,
                    MemberDependantUpdate(card_no=final_new_card),
                )
        update_data = CardReplacementUpdate(
            status="approved",
            new_card_no=final_new_card or None,
        )
        updated = await self.repo.update(replacement_id, update_data)
        if not updated:
            raise ResourceNotFoundException("Card replacement not found")
        return updated
