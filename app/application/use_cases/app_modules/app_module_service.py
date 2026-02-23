"""App module service: list modules (global)."""

from app.application.dtos.user import AppModuleResult
from app.infrastructure.persistence.repositories.app_module_repo import (
    AppModuleRepository,
)


class AppModuleService:
    def __init__(self, repo: AppModuleRepository) -> None:
        self.repo = repo

    async def list_all(
        self, skip: int = 0, limit: int = 200, status: str | None = "active"
    ) -> list[AppModuleResult]:
        return await self.repo.list_all(skip=skip, limit=limit, status=status)
