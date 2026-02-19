"""Account detail service. CRUD + update_balance, update_hospital_balance."""

from decimal import Decimal

from app.application.dtos.banking import (
    AccountDetailCreate,
    AccountDetailResult,
    AccountDetailUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.account_detail_repo import (
    AccountDetailRepository,
)


class AccountDetailService:
    def __init__(self, repo: AccountDetailRepository) -> None:
        self.repo = repo

    async def create(self, data: AccountDetailCreate) -> AccountDetailResult:
        if data.account_type not in ("member", "hospital"):
            raise ValidationException(
                "account_type must be 'member' or 'hospital'",
                field="account_type",
            )
        if data.member_id and data.hospital_id:
            raise ValidationException(
                "Provide either member_id or hospital_id, not both",
                field="member_id",
            )
        if data.account_type == "member" and not data.member_id:
            raise ValidationException(
                "member_id required for member account",
                field="member_id",
            )
        if data.account_type == "hospital" and not data.hospital_id:
            raise ValidationException(
                "hospital_id required for hospital account",
                field="hospital_id",
            )
        return await self.repo.create(data)

    async def get_by_id(self, account_id: str) -> AccountDetailResult:
        r = await self.repo.get_by_id(account_id)
        if not r:
            raise ResourceNotFoundException("Account not found")
        return r

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        member_id: str | None = None,
        hospital_id: str | None = None,
        status: str | None = None,
    ) -> list[AccountDetailResult]:
        return await self.repo.list_by_tenant(
            skip=skip,
            limit=limit,
            member_id=member_id,
            hospital_id=hospital_id,
            status=status,
        )

    async def update(
        self, account_id: str, data: AccountDetailUpdate
    ) -> AccountDetailResult:
        updated = await self.repo.update(account_id, data)
        if not updated:
            raise ResourceNotFoundException("Account not found")
        return updated

    async def check_if_account_exists(
        self,
        *,
        member_id: str | None = None,
        hospital_id: str | None = None,
        account_type: str | None = None,
    ) -> bool:
        return await self.repo.check_if_account_exists(
            member_id=member_id,
            hospital_id=hospital_id,
            account_type=account_type,
        )

    async def update_balance(
        self, account_id: str, balance_delta: Decimal
    ) -> AccountDetailResult:
        updated = await self.repo.update_balance(account_id, balance_delta)
        if not updated:
            raise ResourceNotFoundException("Account not found")
        return updated

    async def update_hospital_balance(
        self, hospital_id: str, balance_delta: Decimal
    ) -> AccountDetailResult:
        updated = await self.repo.update_hospital_balance(
            hospital_id, balance_delta
        )
        if not updated:
            raise ResourceNotFoundException(
                "No account found for this hospital"
            )
        return updated
