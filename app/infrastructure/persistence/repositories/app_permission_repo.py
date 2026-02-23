"""AppPermission repository. User per-module permissions."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.user import AppPermissionResult
from app.infrastructure.persistence.models.app_permission import AppPermission


def _to_result(p: AppPermission) -> AppPermissionResult:
    return AppPermissionResult(
        id=p.id,
        user_id=p.user_id,
        module_id=p.module_id,
        can_view=p.can_view,
        can_create=p.can_create,
        can_edit=p.can_edit,
        can_delete=p.can_delete,
        can_approve=p.can_approve,
    )


class AppPermissionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_by_user_id(self, user_id: str) -> list[AppPermissionResult]:
        r = await self.db.execute(
            select(AppPermission)
            .where(AppPermission.user_id == user_id)
            .order_by(AppPermission.module_id)
        )
        return [_to_result(p) for p in r.scalars().all()]

    async def get_by_user_and_module(
        self, user_id: str, module_id: str
    ) -> AppPermissionResult | None:
        r = await self.db.execute(
            select(AppPermission).where(
                AppPermission.user_id == user_id,
                AppPermission.module_id == module_id,
            )
        )
        p = r.scalar_one_or_none()
        return _to_result(p) if p else None

    async def create(
        self,
        user_id: str,
        module_id: str,
        *,
        can_view: bool = True,
        can_create: bool = True,
        can_edit: bool = True,
        can_delete: bool = True,
        can_approve: bool = True,
    ) -> AppPermissionResult:
        """Create a permission for a user on a module."""
        p = AppPermission(
            user_id=user_id,
            module_id=module_id,
            can_view=can_view,
            can_create=can_create,
            can_edit=can_edit,
            can_delete=can_delete,
            can_approve=can_approve,
        )
        self.db.add(p)
        await self.db.flush()
        await self.db.refresh(p)
        return _to_result(p)
