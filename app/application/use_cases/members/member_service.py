"""Member service: create, get, list, update, soft_delete. Tenant-scoped."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.application.dtos.member import MemberCreate, MemberResult, MemberUpdate
from app.domain.exceptions import ResourceNotFoundException, ValidationException

if TYPE_CHECKING:
    from app.application.interfaces.repositories import IMemberRepository


class MemberService:
    """Member use cases. Depends on IMemberRepository."""

    def __init__(self, member_repo: IMemberRepository) -> None:
        self.member_repo = member_repo

    async def create_member(self, data: MemberCreate) -> MemberResult:
        """Create a member."""
        if not data.name or not data.name.strip():
            raise ValidationException("Member name is required", field="name")
        if not data.company_id or not data.company_id.strip():
            raise ValidationException("Member must belong to a company", field="company_id")
        if not data.scheme_id or not data.scheme_id.strip():
            raise ValidationException("Member must belong to a scheme", field="scheme_id")
        if not data.card_no or not data.card_no.strip():
            raise ValidationException("Card number is required", field="card_no")
        if await self.member_repo.exists_by_card_no(data.card_no):
            raise ValidationException(
                "Another member already has this card number",
                field="card_no",
            )
        return await self.member_repo.create(data)

    async def get_by_id(self, member_id: str) -> MemberResult:
        """Get member by ID. Raises ResourceNotFoundException if not found."""
        member = await self.member_repo.get_by_id(member_id)
        if not member:
            raise ResourceNotFoundException("Member not found")
        return member

    async def list_members(
        self,
        skip: int = 0,
        limit: int = 100,
        company_id: str | None = None,
        scheme_id: str | None = None,
    ) -> list[MemberResult]:
        """List members for the tenant with optional filters."""
        return await self.member_repo.list_by_tenant(
            skip=skip, limit=limit, company_id=company_id, scheme_id=scheme_id
        )

    async def update_member(self, member_id: str, data: MemberUpdate) -> MemberResult:
        """Update a member. Raises ResourceNotFoundException if not found."""
        if data.card_no is not None and data.card_no.strip():
            if await self.member_repo.exists_by_card_no(
                data.card_no, exclude_member_id=member_id
            ):
                raise ValidationException(
                    "Another member already has this card number",
                    field="card_no",
                )
        updated = await self.member_repo.update(member_id, data)
        if not updated:
            raise ResourceNotFoundException("Member not found")
        return updated

    async def soft_delete_member(self, member_id: str) -> None:
        """Soft-delete a member. Raises ResourceNotFoundException if not found."""
        ok = await self.member_repo.soft_delete(member_id)
        if not ok:
            raise ResourceNotFoundException("Member not found")
