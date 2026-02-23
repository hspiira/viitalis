"""Bank branch repository. Tenant-scoped; list by bank_id."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.banking import (
    BankBranchCreate,
    BankBranchResult,
    BankBranchUpdate,
)
from app.infrastructure.persistence.models.bank import Bank
from app.infrastructure.persistence.models.bank_branch import BankBranch


def _to_result(bb: BankBranch) -> BankBranchResult:
    return BankBranchResult(
        id=bb.id,
        tenant_id=bb.tenant_id,
        bank_id=bb.bank_id,
        name=bb.name,
        address=bb.address,
        status=bb.status,
    )


class BankBranchRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, branch_id: str) -> BankBranchResult | None:
        r = await self.db.execute(
            select(BankBranch).where(
                BankBranch.id == branch_id,
                BankBranch.tenant_id == self.tenant_id,
            )
        )
        bb = r.scalar_one_or_none()
        return _to_result(bb) if bb else None

    async def list_by_bank(
        self,
        bank_id: str,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
    ) -> list[BankBranchResult]:
        q = select(BankBranch).where(
            BankBranch.tenant_id == self.tenant_id,
            BankBranch.bank_id == bank_id,
        )
        if status is not None:
            q = q.where(BankBranch.status == status)
        q = q.offset(skip).limit(limit).order_by(BankBranch.name)
        r = await self.db.execute(q)
        return [_to_result(bb) for bb in r.scalars().all()]

    async def create(self, data: BankBranchCreate) -> BankBranchResult:
        bb = BankBranch(
            tenant_id=self.tenant_id,
            bank_id=data.bank_id,
            name=data.name.strip(),
            address=data.address.strip() if data.address else None,
            status=data.status,
        )
        self.db.add(bb)
        await self.db.flush()
        await self.db.refresh(bb)
        return _to_result(bb)

    async def update(
        self, branch_id: str, data: BankBranchUpdate
    ) -> BankBranchResult | None:
        r = await self.db.execute(
            select(BankBranch).where(
                BankBranch.id == branch_id,
                BankBranch.tenant_id == self.tenant_id,
            )
        )
        bb = r.scalar_one_or_none()
        if not bb:
            return None
        if data.name is not None:
            bb.name = data.name.strip()
        if data.address is not None:
            bb.address = data.address.strip() or None
        if data.status is not None:
            bb.status = data.status
        await self.db.flush()
        await self.db.refresh(bb)
        return _to_result(bb)
