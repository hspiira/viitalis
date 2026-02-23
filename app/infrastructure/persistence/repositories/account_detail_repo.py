"""Account detail repository. CRUD + check_if_account_exists, update_balance."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.banking import (
    AccountDetailCreate,
    AccountDetailResult,
    AccountDetailUpdate,
)
from app.infrastructure.persistence.models.account_detail import AccountDetail


def _to_result(a: AccountDetail) -> AccountDetailResult:
    return AccountDetailResult(
        id=a.id,
        tenant_id=a.tenant_id,
        member_id=a.member_id,
        hospital_id=a.hospital_id,
        account_type=a.account_type,
        balance=Decimal(str(a.balance)),
        virtual_balance=Decimal(str(a.virtual_balance)),
        currency=a.currency,
        status=a.status,
    )


class AccountDetailRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, account_id: str) -> AccountDetailResult | None:
        r = await self.db.execute(
            select(AccountDetail).where(
                AccountDetail.id == account_id,
                AccountDetail.tenant_id == self.tenant_id,
            )
        )
        a = r.scalar_one_or_none()
        return _to_result(a) if a else None

    async def list_by_tenant(
        self,
        skip: int = 0,
        limit: int = 100,
        member_id: str | None = None,
        hospital_id: str | None = None,
        status: str | None = None,
    ) -> list[AccountDetailResult]:
        q = select(AccountDetail).where(AccountDetail.tenant_id == self.tenant_id)
        if member_id is not None:
            q = q.where(AccountDetail.member_id == member_id)
        if hospital_id is not None:
            q = q.where(AccountDetail.hospital_id == hospital_id)
        if status is not None:
            q = q.where(AccountDetail.status == status)
        q = q.offset(skip).limit(limit).order_by(AccountDetail.id)
        r = await self.db.execute(q)
        return [_to_result(a) for a in r.scalars().all()]

    async def check_if_account_exists(
        self,
        *,
        member_id: str | None = None,
        hospital_id: str | None = None,
        account_type: str | None = None,
    ) -> bool:
        q = select(AccountDetail.id).where(
            AccountDetail.tenant_id == self.tenant_id,
        )
        if member_id is not None:
            q = q.where(AccountDetail.member_id == member_id)
        if hospital_id is not None:
            q = q.where(AccountDetail.hospital_id == hospital_id)
        if account_type is not None:
            q = q.where(AccountDetail.account_type == account_type)
        q = q.limit(1)
        r = await self.db.execute(q)
        return r.scalar_one_or_none() is not None

    async def create(self, data: AccountDetailCreate) -> AccountDetailResult:
        a = AccountDetail(
            tenant_id=self.tenant_id,
            member_id=data.member_id,
            hospital_id=data.hospital_id,
            account_type=data.account_type,
            balance=data.balance,
            virtual_balance=data.virtual_balance,
            currency=data.currency,
            status=data.status,
        )
        self.db.add(a)
        await self.db.flush()
        await self.db.refresh(a)
        return _to_result(a)

    async def update(
        self, account_id: str, data: AccountDetailUpdate
    ) -> AccountDetailResult | None:
        r = await self.db.execute(
            select(AccountDetail).where(
                AccountDetail.id == account_id,
                AccountDetail.tenant_id == self.tenant_id,
            )
        )
        a = r.scalar_one_or_none()
        if not a:
            return None
        if data.balance is not None:
            a.balance = data.balance
        if data.virtual_balance is not None:
            a.virtual_balance = data.virtual_balance
        if data.currency is not None:
            a.currency = data.currency
        if data.status is not None:
            a.status = data.status
        await self.db.flush()
        await self.db.refresh(a)
        return _to_result(a)

    async def update_balance(
        self, account_id: str, balance_delta: Decimal
    ) -> AccountDetailResult | None:
        """Add balance_delta to current balance. Caller must commit."""
        r = await self.db.execute(
            select(AccountDetail).where(
                AccountDetail.id == account_id,
                AccountDetail.tenant_id == self.tenant_id,
            )
        )
        a = r.scalar_one_or_none()
        if not a:
            return None
        a.balance = a.balance + balance_delta
        await self.db.flush()
        await self.db.refresh(a)
        return _to_result(a)

    async def update_hospital_balance(
        self, hospital_id: str, balance_delta: Decimal
    ) -> AccountDetailResult | None:
        """Find account by hospital_id and add balance_delta. Returns None if no account."""
        r = await self.db.execute(
            select(AccountDetail).where(
                AccountDetail.tenant_id == self.tenant_id,
                AccountDetail.hospital_id == hospital_id,
            ).limit(1)
        )
        a = r.scalar_one_or_none()
        if not a:
            return None
        a.balance = a.balance + balance_delta
        await self.db.flush()
        await self.db.refresh(a)
        return _to_result(a)
