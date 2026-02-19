"""ClaimPayment service: create (and update claim status), list, list by claim. Tenant-scoped."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.application.dtos.claim_payment import ClaimPaymentCreate, ClaimPaymentResult
from app.domain.exceptions import ResourceNotFoundException, ValidationException

if TYPE_CHECKING:
    from app.application.interfaces.repositories import IClaimRepository
    from app.infrastructure.persistence.repositories.claim_payment_repo import (
        ClaimPaymentRepository,
    )


class ClaimPaymentService:
    def __init__(
        self,
        payment_repo: ClaimPaymentRepository,
        claim_repo: IClaimRepository,
    ) -> None:
        self.repo = payment_repo
        self.claim_repo = claim_repo

    async def create_payment(self, data: ClaimPaymentCreate) -> ClaimPaymentResult:
        if not data.claim_id or not data.claim_id.strip():
            raise ValidationException("Claim is required", field="claim_id")
        if data.amount <= 0:
            raise ValidationException("Amount must be positive", field="amount")
        claim = await self.claim_repo.get_by_id(data.claim_id)
        if not claim:
            raise ResourceNotFoundException("Claim not found")
        if not claim.approved_at:
            raise ValidationException(
                "Claim must be approved before a payment can be recorded",
                field="claim_id",
            )
        return await self.repo.create_and_update_claim_status(data)

    async def get_by_id(self, payment_id: str) -> ClaimPaymentResult:
        p = await self.repo.get_by_id(payment_id)
        if not p:
            raise ResourceNotFoundException("Payment not found")
        return p

    async def list_payments(self, skip: int = 0, limit: int = 100) -> list[ClaimPaymentResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit)

    async def list_payments_by_claim(self, claim_id: str) -> list[ClaimPaymentResult]:
        return await self.repo.list_by_claim(claim_id)
