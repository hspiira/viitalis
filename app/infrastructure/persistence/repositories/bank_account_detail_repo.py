"""Bank account detail repository. Links account_detail to bank/branch/account_number."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.banking import (
    BankAccountDetailCreate,
    BankAccountDetailResult,
    BankAccountDetailUpdate,
)
from app.infrastructure.persistence.models.bank_account_detail import (
    BankAccountDetail,
)


def _to_result(bad: BankAccountDetail) -> BankAccountDetailResult:
    return BankAccountDetailResult(
        id=bad.id,
        tenant_id=bad.tenant_id,
        account_detail_id=bad.account_detail_id,
        bank_id=bad.bank_id,
        bank_branch_id=bad.bank_branch_id,
        account_number=bad.account_number,
        status=bad.status,
    )


class BankAccountDetailRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, entity_id: str) -> BankAccountDetailResult | None:
        r = await self.db.execute(
            select(BankAccountDetail).where(
                BankAccountDetail.id == entity_id,
                BankAccountDetail.tenant_id == self.tenant_id,
            )
        )
        bad = r.scalar_one_or_none()
        return _to_result(bad) if bad else None

    async def list_by_account_detail(
        self,
        account_detail_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[BankAccountDetailResult]:
        r = await self.db.execute(
            select(BankAccountDetail)
            .where(
                BankAccountDetail.tenant_id == self.tenant_id,
                BankAccountDetail.account_detail_id == account_detail_id,
            )
            .offset(skip)
            .limit(limit)
            .order_by(BankAccountDetail.account_number)
        )
        return [_to_result(bad) for bad in r.scalars().all()]

    async def create(
        self, data: BankAccountDetailCreate
    ) -> BankAccountDetailResult:
        bad = BankAccountDetail(
            tenant_id=self.tenant_id,
            account_detail_id=data.account_detail_id,
            bank_id=data.bank_id,
            bank_branch_id=data.bank_branch_id,
            account_number=data.account_number.strip(),
            status=data.status,
        )
        self.db.add(bad)
        await self.db.flush()
        await self.db.refresh(bad)
        return _to_result(bad)

    async def update(
        self, entity_id: str, data: BankAccountDetailUpdate
    ) -> BankAccountDetailResult | None:
        r = await self.db.execute(
            select(BankAccountDetail).where(
                BankAccountDetail.id == entity_id,
                BankAccountDetail.tenant_id == self.tenant_id,
            )
        )
        bad = r.scalar_one_or_none()
        if not bad:
            return None
        if data.bank_branch_id is not None:
            bad.bank_branch_id = data.bank_branch_id
        if data.account_number is not None:
            bad.account_number = data.account_number.strip()
        if data.status is not None:
            bad.status = data.status
        await self.db.flush()
        await self.db.refresh(bad)
        return _to_result(bad)
