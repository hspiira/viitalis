"""Reimbursement service: create, get, list, update status. Tenant-scoped."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.application.dtos.reimbursement import (
    ReimbursementCreate,
    ReimbursementResult,
    ReimbursementUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException

if TYPE_CHECKING:
    from app.infrastructure.persistence.repositories.reimbursement_repo import (
        ReimbursementRepository,
    )


class ReimbursementService:
    def __init__(self, repo: ReimbursementRepository) -> None:
        self.repo = repo

    async def create(self, data: ReimbursementCreate) -> ReimbursementResult:
        if not data.claim_id or not data.claim_id.strip():
            raise ValidationException("Claim is required", field="claim_id")
        if data.amount <= 0:
            raise ValidationException("Amount must be positive", field="amount")
        return await self.repo.create(data)

    async def get_by_id(self, reimbursement_id: str) -> ReimbursementResult:
        r = await self.repo.get_by_id(reimbursement_id)
        if not r:
            raise ResourceNotFoundException("Reimbursement not found")
        return r

    async def list_reimbursements(
        self, skip: int = 0, limit: int = 100
    ) -> list[ReimbursementResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit)

    async def update(
        self, reimbursement_id: str, data: ReimbursementUpdate
    ) -> ReimbursementResult:
        updated = await self.repo.update(reimbursement_id, data)
        if not updated:
            raise ResourceNotFoundException("Reimbursement not found")
        return updated

    async def update_status(
        self, reimbursement_id: str, status: str
    ) -> ReimbursementResult:
        return await self.update(
            reimbursement_id, ReimbursementUpdate(status=status)
        )
