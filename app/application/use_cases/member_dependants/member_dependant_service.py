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
    from app.application.interfaces.repositories import IMemberDependantRepository


class MemberDependantService:
    """Member dependant use cases. Depends on IMemberDependantRepository."""

    def __init__(self, dependant_repo: IMemberDependantRepository) -> None:
        self.dependant_repo = dependant_repo

    async def create_dependant(self, data: MemberDependantCreate) -> MemberDependantResult:
        """Create a dependant for a member."""
        if not data.name or not data.name.strip():
            raise ValidationException("Dependant name is required", field="name")
        if not data.member_id or not data.member_id.strip():
            raise ValidationException("Dependant must belong to a member", field="member_id")
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
        updated = await self.dependant_repo.update(dependant_id, data)
        if not updated:
            raise ResourceNotFoundException("Dependant not found")
        return updated

    async def soft_delete_dependant(self, dependant_id: str) -> None:
        """Soft-delete a dependant. Raises ResourceNotFoundException if not found."""
        ok = await self.dependant_repo.soft_delete(dependant_id)
        if not ok:
            raise ResourceNotFoundException("Dependant not found")
