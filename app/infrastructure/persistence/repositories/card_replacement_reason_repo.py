"""Card replacement reason repository. Tenant-scoped CRUD."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.card_replacement import (
    CardReplacementReasonCreate,
    CardReplacementReasonResult,
    CardReplacementReasonUpdate,
)
from app.infrastructure.persistence.models.card_replacement_reason import (
    CardReplacementReason,
)


def _to_result(r: CardReplacementReason) -> CardReplacementReasonResult:
    return CardReplacementReasonResult(
        id=r.id,
        tenant_id=r.tenant_id,
        name=r.name,
        code=r.code,
        status=r.status,
    )


class CardReplacementReasonRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, entity_id: str) -> CardReplacementReasonResult | None:
        row = await self.db.execute(
            select(CardReplacementReason).where(
                CardReplacementReason.id == entity_id,
                CardReplacementReason.tenant_id == self.tenant_id,
            )
        )
        r = row.scalar_one_or_none()
        return _to_result(r) if r else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[CardReplacementReasonResult]:
        q = select(CardReplacementReason).where(
            CardReplacementReason.tenant_id == self.tenant_id
        )
        if status is not None:
            q = q.where(CardReplacementReason.status == status)
        q = q.offset(skip).limit(limit).order_by(CardReplacementReason.name)
        r = await self.db.execute(q)
        return [_to_result(x) for x in r.scalars().all()]

    async def create(
        self, data: CardReplacementReasonCreate
    ) -> CardReplacementReasonResult:
        row = CardReplacementReason(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            code=data.code.strip() if data.code else None,
            status=data.status,
        )
        self.db.add(row)
        await self.db.flush()
        await self.db.refresh(row)
        return _to_result(row)

    async def update(
        self, entity_id: str, data: CardReplacementReasonUpdate
    ) -> CardReplacementReasonResult | None:
        row = await self.db.execute(
            select(CardReplacementReason).where(
                CardReplacementReason.id == entity_id,
                CardReplacementReason.tenant_id == self.tenant_id,
            )
        )
        r = row.scalar_one_or_none()
        if not r:
            return None
        if data.name is not None:
            r.name = data.name.strip()
        if data.code is not None:
            r.code = data.code.strip() or None
        if data.status is not None:
            r.status = data.status
        await self.db.flush()
        await self.db.refresh(r)
        return _to_result(r)
