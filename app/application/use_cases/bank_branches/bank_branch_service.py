"""Bank branch service. Tenant-scoped; list by bank_id."""

from app.application.dtos.banking import (
    BankBranchCreate,
    BankBranchResult,
    BankBranchUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.bank_branch_repo import (
    BankBranchRepository,
)
from app.infrastructure.persistence.repositories.bank_repo import BankRepository


class BankBranchService:
    def __init__(
        self,
        branch_repo: BankBranchRepository,
        bank_repo: BankRepository,
    ) -> None:
        self.branch_repo = branch_repo
        self.bank_repo = bank_repo

    async def create(self, data: BankBranchCreate) -> BankBranchResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Name is required", field="name")
        bank = await self.bank_repo.get_by_id(data.bank_id)
        if not bank:
            raise ValidationException("Bank not found", field="bank_id")
        return await self.branch_repo.create(data)

    async def get_by_id(self, branch_id: str) -> BankBranchResult:
        r = await self.branch_repo.get_by_id(branch_id)
        if not r:
            raise ResourceNotFoundException("Bank branch not found")
        return r

    async def list_by_bank(
        self,
        bank_id: str,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
    ) -> list[BankBranchResult]:
        bank = await self.bank_repo.get_by_id(bank_id)
        if not bank:
            raise ResourceNotFoundException("Bank not found")
        return await self.branch_repo.list_by_bank(
            bank_id, skip=skip, limit=limit, status=status
        )

    async def update(
        self, branch_id: str, data: BankBranchUpdate
    ) -> BankBranchResult:
        updated = await self.branch_repo.update(branch_id, data)
        if not updated:
            raise ResourceNotFoundException("Bank branch not found")
        return updated
