"""Member dependant service: create, get, list by member, update, soft_delete. Tenant-scoped."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.application.dtos.member_dependant import (
    MemberDependantCreate,
    MemberDependantResult,
    MemberDependantUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException

if TYPE_CHECKING:
    from app.application.interfaces.repositories import (
        IClaimRepository,
        IMemberDependantRepository,
    )


class MemberDependantService:
    """Member dependant use cases. Depends on IMemberDependantRepository and IClaimRepository (for delete guard)."""

    def __init__(
        self,
        dependant_repo: IMemberDependantRepository,
        claim_repo: IClaimRepository,
    ) -> None:
        self.dependant_repo = dependant_repo
        self.claim_repo = claim_repo

    async def create_dependant(self, data: MemberDependantCreate) -> MemberDependantResult:
        """Create a dependant for a member."""
        if not data.name or not data.name.strip():
            raise ValidationException("Dependant name is required", field="name")
        if not data.member_id or not data.member_id.strip():
            raise ValidationException("Dependant must belong to a member", field="member_id")
        if data.card_no and data.card_no.strip():
            if await self.dependant_repo.exists_by_card_no(data.card_no):
                raise ValidationException(
                    "Another dependant already has this card number",
                    field="card_no",
                )
        return await self.dependant_repo.create(data)

    async def get_by_id(self, dependant_id: str) -> MemberDependantResult:
        """Get dependant by ID. Raises ResourceNotFoundException if not found."""
        dep = await self.dependant_repo.get_by_id(dependant_id)
        if not dep:
            raise ResourceNotFoundException("Dependant not found")
        return dep

    async def list_by_member(
        self, member_id: str, skip: int = 0, limit: int = 100
    ) -> list[MemberDependantResult]:
        """List dependants for a member."""
        return await self.dependant_repo.list_by_member(
            member_id=member_id, skip=skip, limit=limit
        )

    async def update_dependant(
        self, dependant_id: str, data: MemberDependantUpdate
    ) -> MemberDependantResult:
        """Update a dependant. Raises ResourceNotFoundException if not found."""
        if data.card_no is not None and data.card_no.strip():
            if await self.dependant_repo.exists_by_card_no(
                data.card_no, exclude_dependant_id=dependant_id
            ):
                raise ValidationException(
                    "Another dependant already has this card number",
                    field="card_no",
                )
        updated = await self.dependant_repo.update(dependant_id, data)
        if not updated:
            raise ResourceNotFoundException("Dependant not found")
        return updated

    async def soft_delete_dependant(self, dependant_id: str) -> None:
        """Soft-delete a dependant. Fails if any claims reference this dependant."""
        await self.get_by_id(dependant_id)  # raise if not found
        if await self.claim_repo.exists_by_dependant_id(dependant_id):
            raise ValidationException(
                "Cannot delete dependant that has claims; remove or reassign claims first",
                field="dependant_id",
            )
        ok = await self.dependant_repo.soft_delete(dependant_id)
        if not ok:
            raise ResourceNotFoundException("Dependant not found")
