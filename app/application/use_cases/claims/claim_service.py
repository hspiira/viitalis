"""Claim service: create (with details), get, list, update, list_details. Tenant-scoped."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from app.application.dtos.claim import (
    ClaimCreate,
    ClaimDetailCreate,
    ClaimDetailResult,
    ClaimResult,
    ClaimUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException

if TYPE_CHECKING:
    from app.application.interfaces.repositories import IClaimRepository


class ClaimService:
    def __init__(self, claim_repo: IClaimRepository) -> None:
        self.claim_repo = claim_repo

    async def create_claim(
        self, data: ClaimCreate, details: list[ClaimDetailCreate]
    ) -> ClaimResult:
        if not data.member_id or not data.member_id.strip():
            raise ValidationException("Member is required", field="member_id")
        if not data.hospital_id or not data.hospital_id.strip():
            raise ValidationException("Hospital is required", field="hospital_id")
        if not data.service_date:
            raise ValidationException("Service date is required", field="service_date")
        if data.service_date > date.today():
            raise ValidationException(
                "Service date cannot be in the future", field="service_date"
            )
        return await self.claim_repo.create_with_details(data, details)

    async def get_by_id(self, claim_id: str) -> ClaimResult:
        claim = await self.claim_repo.get_by_id(claim_id)
        if not claim:
            raise ResourceNotFoundException("Claim not found")
        return claim

    async def list_claims(
        self,
        skip: int = 0,
        limit: int = 100,
        member_id: str | None = None,
        status: str | None = None,
        hospital_id: str | None = None,
        service_date_from: date | None = None,
        service_date_to: date | None = None,
    ) -> list[ClaimResult]:
        return await self.claim_repo.list_by_tenant(
            skip=skip,
            limit=limit,
            member_id=member_id,
            status=status,
            hospital_id=hospital_id,
            service_date_from=service_date_from,
            service_date_to=service_date_to,
        )

    async def update_claim(self, claim_id: str, data: ClaimUpdate) -> ClaimResult:
        updated = await self.claim_repo.update(claim_id, data)
        if not updated:
            raise ResourceNotFoundException("Claim not found")
        return updated

    async def list_details(self, claim_id: str) -> list[ClaimDetailResult]:
        await self.get_by_id(claim_id)  # ensure claim exists and tenant-scoped
        return await self.claim_repo.list_details(claim_id)

    async def update_approval(
        self,
        claim_id: str,
        approved: bool,
        approved_by: str | None = None,
        comments: str | None = None,
    ) -> ClaimResult:
        updated = await self.claim_repo.update_approval(
            claim_id, approved=approved, approved_by=approved_by, comments=comments
        )
        if not updated:
            raise ResourceNotFoundException("Claim not found")
        return updated

    async def bulk_approve(
        self,
        claim_ids: list[str],
        approved: bool,
        approved_by: str | None = None,
        comments: str | None = None,
    ) -> int:
        return await self.claim_repo.bulk_approve(
            claim_ids, approved=approved, approved_by=approved_by, comments=comments
        )
