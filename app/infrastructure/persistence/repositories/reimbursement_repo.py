"""Reimbursement repository. Tenant-scoped."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.reimbursement import (
    ReimbursementCreate,
    ReimbursementResult,
    ReimbursementUpdate,
)
from app.infrastructure.persistence.models.reimbursement import Reimbursement


def _to_result(r: Reimbursement) -> ReimbursementResult:
    return ReimbursementResult(
        id=r.id, tenant_id=r.tenant_id, claim_id=r.claim_id, amount=r.amount, status=r.status
    )


class ReimbursementRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, reimbursement_id: str) -> ReimbursementResult | None:
        result = await self.db.execute(
            select(Reimbursement).where(
                Reimbursement.id == reimbursement_id,
                Reimbursement.tenant_id == self.tenant_id,
            )
        )
        r = result.scalar_one_or_none()
        return _to_result(r) if r else None

    async def list_by_tenant(self, skip: int = 0, limit: int = 100) -> list[ReimbursementResult]:
        result = await self.db.execute(
            select(Reimbursement)
            .where(Reimbursement.tenant_id == self.tenant_id)
            .offset(skip)
            .limit(limit)
            .order_by(Reimbursement.id.desc())
        )
        return [_to_result(r) for r in result.scalars().all()]

    async def create(self, data: ReimbursementCreate) -> ReimbursementResult:
        r = Reimbursement(
            tenant_id=self.tenant_id,
            claim_id=data.claim_id,
            amount=data.amount,
            status=data.status,
        )
        self.db.add(r)
        await self.db.flush()
        await self.db.refresh(r)
        return _to_result(r)

    async def update(
        self, reimbursement_id: str, data: ReimbursementUpdate
    ) -> ReimbursementResult | None:
        result = await self.db.execute(
            select(Reimbursement).where(
                Reimbursement.id == reimbursement_id,
                Reimbursement.tenant_id == self.tenant_id,
            )
        )
        r = result.scalar_one_or_none()
        if not r:
            return None
        if data.status is not None:
            r.status = data.status
        await self.db.flush()
        await self.db.refresh(r)
        return _to_result(r)
