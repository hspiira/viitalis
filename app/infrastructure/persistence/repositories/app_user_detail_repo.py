"""AppUserDetail repository. One-to-one with AppUser."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.user import (
    UserDetailCreate,
    UserDetailResult,
    UserDetailUpdate,
)
from app.infrastructure.persistence.models.app_user_detail import AppUserDetail


def _to_result(d: AppUserDetail) -> UserDetailResult:
    return UserDetailResult(
        id=d.id,
        user_id=d.user_id,
        full_name=d.full_name,
        phone=d.phone,
        avatar_url=d.avatar_url,
        remarks=d.remarks,
    )


class AppUserDetailRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_user_id(self, user_id: str) -> UserDetailResult | None:
        r = await self.db.execute(
            select(AppUserDetail).where(AppUserDetail.user_id == user_id)
        )
        d = r.scalar_one_or_none()
        return _to_result(d) if d else None

    async def create(self, data: UserDetailCreate) -> UserDetailResult:
        d = AppUserDetail(
            user_id=data.user_id,
            full_name=data.full_name.strip() if data.full_name else None,
            phone=data.phone.strip() if data.phone else None,
            avatar_url=data.avatar_url.strip() if data.avatar_url else None,
            remarks=data.remarks.strip() if data.remarks else None,
        )
        self.db.add(d)
        await self.db.flush()
        await self.db.refresh(d)
        return _to_result(d)

    async def update(
        self, user_id: str, data: UserDetailUpdate
    ) -> UserDetailResult | None:
        r = await self.db.execute(
            select(AppUserDetail).where(AppUserDetail.user_id == user_id)
        )
        d = r.scalar_one_or_none()
        if not d:
            return None
        if data.full_name is not None:
            d.full_name = data.full_name.strip() or None
        if data.phone is not None:
            d.phone = data.phone.strip() or None
        if data.avatar_url is not None:
            d.avatar_url = data.avatar_url.strip() or None
        if data.remarks is not None:
            d.remarks = data.remarks.strip() or None
        await self.db.flush()
        await self.db.refresh(d)
        return _to_result(d)
