"""AppUserLog repository. Append-only."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.user import AppUserLogCreate, AppUserLogResult
from app.infrastructure.persistence.models.app_user_log import AppUserLog


def _to_result(l: AppUserLog) -> AppUserLogResult:
    return AppUserLogResult(
        id=l.id,
        user_id=l.user_id,
        tenant_id=l.tenant_id,
        action=l.action,
        module=l.module,
        entity_id=l.entity_id,
        ip=l.ip,
        details=l.details,
        created_at=l.created_at,
    )


class AppUserLogRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, data: AppUserLogCreate) -> AppUserLogResult:
        log = AppUserLog(
            user_id=data.user_id,
            tenant_id=data.tenant_id,
            action=data.action,
            module=data.module,
            entity_id=data.entity_id,
            ip=data.ip,
            details=data.details,
        )
        self.db.add(log)
        await self.db.flush()
        await self.db.refresh(log)
        return _to_result(log)

    async def list_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 100,
        action: str | None = None,
    ) -> list[AppUserLogResult]:
        q = select(AppUserLog).where(AppUserLog.user_id == user_id)
        if action is not None:
            q = q.where(AppUserLog.action == action)
        q = q.offset(skip).limit(limit).order_by(AppUserLog.created_at.desc())
        r = await self.db.execute(q)
        return [_to_result(l) for l in r.scalars().all()]

    async def list_by_tenant(
        self,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
        user_id: str | None = None,
        action: str | None = None,
    ) -> list[AppUserLogResult]:
        q = select(AppUserLog).where(AppUserLog.tenant_id == tenant_id)
        if user_id is not None:
            q = q.where(AppUserLog.user_id == user_id)
        if action is not None:
            q = q.where(AppUserLog.action == action)
        q = q.offset(skip).limit(limit).order_by(AppUserLog.created_at.desc())
        r = await self.db.execute(q)
        return [_to_result(l) for l in r.scalars().all()]
