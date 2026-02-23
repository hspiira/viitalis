"""Bank account detail service. Links account to bank/branch/account_number."""

from app.application.dtos.banking import (
    BankAccountDetailCreate,
    BankAccountDetailResult,
    BankAccountDetailUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.account_detail_repo import (
    AccountDetailRepository,
)
from app.infrastructure.persistence.repositories.bank_account_detail_repo import (
    BankAccountDetailRepository,
)
from app.infrastructure.persistence.repositories.bank_repo import BankRepository


class BankAccountDetailService:
    def __init__(
        self,
        repo: BankAccountDetailRepository,
        account_repo: AccountDetailRepository,
        bank_repo: BankRepository,
    ) -> None:
        self.repo = repo
        self.account_repo = account_repo
        self.bank_repo = bank_repo

    async def create(
        self, data: BankAccountDetailCreate
    ) -> BankAccountDetailResult:
        if not data.account_number or not data.account_number.strip():
            raise ValidationException(
                "account_number is required",
                field="account_number",
            )
        acc = await self.account_repo.get_by_id(data.account_detail_id)
        if not acc:
            raise ValidationException(
                "Account not found",
                field="account_detail_id",
            )
        bank = await self.bank_repo.get_by_id(data.bank_id)
        if not bank:
            raise ValidationException("Bank not found", field="bank_id")
        return await self.repo.create(data)

    async def get_by_id(self, entity_id: str) -> BankAccountDetailResult:
        r = await self.repo.get_by_id(entity_id)
        if not r:
            raise ResourceNotFoundException("Bank account detail not found")
        return r

    async def list_by_account_detail(
        self,
        account_detail_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[BankAccountDetailResult]:
        acc = await self.account_repo.get_by_id(account_detail_id)
        if not acc:
            raise ResourceNotFoundException("Account not found")
        return await self.repo.list_by_account_detail(
            account_detail_id, skip=skip, limit=limit
        )

    async def update(
        self, entity_id: str, data: BankAccountDetailUpdate
    ) -> BankAccountDetailResult:
        updated = await self.repo.update(entity_id, data)
        if not updated:
            raise ResourceNotFoundException("Bank account detail not found")
        return updated
