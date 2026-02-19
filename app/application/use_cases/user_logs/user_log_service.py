"""User log service: list logs by tenant (audit trail)."""

from app.application.dtos.user import AppUserLogResult
from app.infrastructure.persistence.repositories.app_user_log_repo import (
    AppUserLogRepository,
)


class UserLogService:
    def __init__(self, repo: AppUserLogRepository) -> None:
        self.repo = repo

    async def list_by_tenant(
        self,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
        user_id: str | None = None,
        action: str | None = None,
    ) -> list[AppUserLogResult]:
        return await self.repo.list_by_tenant(
            tenant_id, skip=skip, limit=limit, user_id=user_id, action=action
        )
