"""AppModule repository. Global modules (no tenant)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.user import AppModuleResult
from app.infrastructure.persistence.models.app_module import AppModule


def _to_result(m: AppModule) -> AppModuleResult:
    return AppModuleResult(
        id=m.id,
        code=m.code,
        name=m.name,
        parent_id=m.parent_id,
        module_order=m.module_order,
        status=m.status,
    )


class AppModuleRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, module_id: str) -> AppModuleResult | None:
        r = await self.db.execute(select(AppModule).where(AppModule.id == module_id))
        m = r.scalar_one_or_none()
        return _to_result(m) if m else None

    async def get_by_code(self, code: str) -> AppModuleResult | None:
        r = await self.db.execute(select(AppModule).where(AppModule.code == code))
        m = r.scalar_one_or_none()
        return _to_result(m) if m else None

    async def list_all(
        self, skip: int = 0, limit: int = 200, status: str | None = "active"
    ) -> list[AppModuleResult]:
        q = select(AppModule)
        if status is not None:
            q = q.where(AppModule.status == status)
        q = q.offset(skip).limit(limit).order_by(AppModule.module_order, AppModule.name)
        r = await self.db.execute(q)
        return [_to_result(m) for m in r.scalars().all()]
