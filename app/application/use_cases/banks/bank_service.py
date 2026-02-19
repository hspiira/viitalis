"""Bank service. Tenant-scoped CRUD."""

from app.application.dtos.banking import BankCreate, BankResult, BankUpdate
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.bank_repo import BankRepository


class BankService:
    def __init__(self, repo: BankRepository) -> None:
        self.repo = repo

    async def create(self, data: BankCreate) -> BankResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Name is required", field="name")
        return await self.repo.create(data)

    async def get_by_id(self, bank_id: str) -> BankResult:
        r = await self.repo.get_by_id(bank_id)
        if not r:
            raise ResourceNotFoundException("Bank not found")
        return r

    async def list(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[BankResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit, status=status)

    async def update(self, bank_id: str, data: BankUpdate) -> BankResult:
        updated = await self.repo.update(bank_id, data)
        if not updated:
            raise ResourceNotFoundException("Bank not found")
        return updated
