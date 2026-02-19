"""Bank repository. Tenant-scoped CRUD."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.banking import BankCreate, BankResult, BankUpdate
from app.infrastructure.persistence.models.bank import Bank


def _to_result(b: Bank) -> BankResult:
    return BankResult(
        id=b.id,
        tenant_id=b.tenant_id,
        name=b.name,
        code=b.code,
        status=b.status,
    )


class BankRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, bank_id: str) -> BankResult | None:
        r = await self.db.execute(
            select(Bank).where(
                Bank.id == bank_id,
                Bank.tenant_id == self.tenant_id,
            )
        )
        b = r.scalar_one_or_none()
        return _to_result(b) if b else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[BankResult]:
        q = select(Bank).where(Bank.tenant_id == self.tenant_id)
        if status is not None:
            q = q.where(Bank.status == status)
        q = q.offset(skip).limit(limit).order_by(Bank.name)
        r = await self.db.execute(q)
        return [_to_result(b) for b in r.scalars().all()]

    async def create(self, data: BankCreate) -> BankResult:
        b = Bank(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            code=data.code.strip() if data.code else None,
            status=data.status,
        )
        self.db.add(b)
        await self.db.flush()
        await self.db.refresh(b)
        return _to_result(b)

    async def update(self, bank_id: str, data: BankUpdate) -> BankResult | None:
        r = await self.db.execute(
            select(Bank).where(
                Bank.id == bank_id,
                Bank.tenant_id == self.tenant_id,
            )
        )
        b = r.scalar_one_or_none()
        if not b:
            return None
        if data.name is not None:
            b.name = data.name.strip()
        if data.code is not None:
            b.code = data.code.strip() or None
        if data.status is not None:
            b.status = data.status
        await self.db.flush()
        await self.db.refresh(b)
        return _to_result(b)
