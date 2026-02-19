"""ClaimPayment repository. Tenant-scoped. Create payment + update claim status in one transaction."""

from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.claim_payment import ClaimPaymentCreate, ClaimPaymentResult
from app.infrastructure.persistence.models.claim import Claim
from app.infrastructure.persistence.models.claim_payment import ClaimPayment


def _to_result(p: ClaimPayment) -> ClaimPaymentResult:
    return ClaimPaymentResult(
        id=p.id,
        tenant_id=p.tenant_id,
        claim_id=p.claim_id,
        amount=p.amount,
        payment_date=p.payment_date,
    )


class ClaimPaymentRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, payment_id: str) -> ClaimPaymentResult | None:
        r = await self.db.execute(
            select(ClaimPayment).where(
                ClaimPayment.id == payment_id,
                ClaimPayment.tenant_id == self.tenant_id,
            )
        )
        p = r.scalar_one_or_none()
        return _to_result(p) if p else None

    async def list_by_tenant(self, skip: int = 0, limit: int = 100) -> list[ClaimPaymentResult]:
        r = await self.db.execute(
            select(ClaimPayment)
            .where(ClaimPayment.tenant_id == self.tenant_id)
            .offset(skip)
            .limit(limit)
            .order_by(ClaimPayment.payment_date.desc())
        )
        return [_to_result(p) for p in r.scalars().all()]

    async def list_by_claim(self, claim_id: str) -> list[ClaimPaymentResult]:
        r = await self.db.execute(
            select(ClaimPayment).where(
                ClaimPayment.tenant_id == self.tenant_id,
                ClaimPayment.claim_id == claim_id,
            ).order_by(ClaimPayment.payment_date.desc())
        )
        return [_to_result(p) for p in r.scalars().all()]

    async def create_and_update_claim_status(
        self, data: ClaimPaymentCreate
    ) -> ClaimPaymentResult:
        """Create payment and set claim status to 'paid' in one transaction."""
        payment = ClaimPayment(
            tenant_id=self.tenant_id,
            claim_id=data.claim_id,
            amount=data.amount,
            payment_date=data.payment_date,
        )
        self.db.add(payment)
        await self.db.flush()
        r = await self.db.execute(
            select(Claim).where(
                Claim.id == data.claim_id, Claim.tenant_id == self.tenant_id
            )
        )
        claim = r.scalar_one_or_none()
        if claim:
            claim.status = "paid"
        await self.db.flush()
        await self.db.refresh(payment)
        return _to_result(payment)
