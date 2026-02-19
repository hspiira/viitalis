"""Card replacement repository. Tenant-scoped."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.card_replacement import (
    CardReplacementCreate,
    CardReplacementResult,
    CardReplacementUpdate,
)
from app.infrastructure.persistence.models.card_replacement import CardReplacement


def _to_result(r: CardReplacement) -> CardReplacementResult:
    return CardReplacementResult(
        id=r.id,
        tenant_id=r.tenant_id,
        member_id=r.member_id,
        dependant_id=r.dependant_id,
        reason_id=r.reason_id,
        old_card_no=r.old_card_no,
        new_card_no=r.new_card_no,
        requested_at=r.requested_at,
        status=r.status,
    )


class CardReplacementRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, entity_id: str) -> CardReplacementResult | None:
        row = await self.db.execute(
            select(CardReplacement).where(
                CardReplacement.id == entity_id,
                CardReplacement.tenant_id == self.tenant_id,
            )
        )
        r = row.scalar_one_or_none()
        return _to_result(r) if r else None

    async def list_by_tenant(
        self,
        skip: int = 0,
        limit: int = 100,
        member_id: str | None = None,
        dependant_id: str | None = None,
        status: str | None = None,
    ) -> list[CardReplacementResult]:
        q = select(CardReplacement).where(
            CardReplacement.tenant_id == self.tenant_id
        )
        if member_id is not None:
            q = q.where(CardReplacement.member_id == member_id)
        if dependant_id is not None:
            q = q.where(CardReplacement.dependant_id == dependant_id)
        if status is not None:
            q = q.where(CardReplacement.status == status)
        q = q.offset(skip).limit(limit).order_by(CardReplacement.requested_at.desc())
        r = await self.db.execute(q)
        return [_to_result(x) for x in r.scalars().all()]

    async def create(self, data: CardReplacementCreate) -> CardReplacementResult:
        row = CardReplacement(
            tenant_id=self.tenant_id,
            member_id=data.member_id,
            dependant_id=data.dependant_id,
            reason_id=data.reason_id,
            old_card_no=data.old_card_no,
            new_card_no=data.new_card_no,
            status=data.status,
        )
        self.db.add(row)
        await self.db.flush()
        await self.db.refresh(row)
        return _to_result(row)

    async def update(
        self, entity_id: str, data: CardReplacementUpdate
    ) -> CardReplacementResult | None:
        """Update status and/or new_card_no. Returns updated result or None if not found."""
        r = await self.db.execute(
            select(CardReplacement).where(
                CardReplacement.id == entity_id,
                CardReplacement.tenant_id == self.tenant_id,
            )
        )
        row = r.scalar_one_or_none()
        if not row:
            return None
        if data.status is not None:
            row.status = data.status
        if data.new_card_no is not None:
            row.new_card_no = data.new_card_no
        await self.db.flush()
        await self.db.refresh(row)
        return _to_result(row)
