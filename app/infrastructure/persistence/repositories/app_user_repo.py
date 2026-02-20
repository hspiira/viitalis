"""AppUser repository. Tenant-scoped."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.user import UserResult
from app.infrastructure.persistence.models.app_user import AppUser


def _to_result(u: AppUser) -> UserResult:
    return UserResult(
        id=u.id,
        tenant_id=u.tenant_id,
        username=u.username,
        email=u.email,
        is_active=u.is_active,
    )


class AppUserRepository:
    def __init__(self, db: AsyncSession, tenant_id: str | None = None) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, user_id: str) -> UserResult | None:
        q = select(AppUser).where(AppUser.id == user_id)
        if self.tenant_id is not None:
            q = q.where(AppUser.tenant_id == self.tenant_id)
        r = await self.db.execute(q)
        u = r.scalar_one_or_none()
        return _to_result(u) if u else None

    async def get_by_tenant_and_username(
        self, tenant_id: str, username: str
    ) -> tuple[UserResult, str] | None:
        """Return (UserResult, password_hash) or None. Used for login."""
        r = await self.db.execute(
            select(AppUser).where(
                AppUser.tenant_id == tenant_id,
                AppUser.username == username,
                AppUser.is_active.is_(True),
            )
        )
        u = r.scalar_one_or_none()
        if not u:
            return None
        return (_to_result(u), u.password_hash)

    async def create(
        self,
        tenant_id: str,
        username: str,
        email: str | None,
        password_hash: str,
    ) -> UserResult:
        """Create an app user for a tenant. Caller must ensure (tenant_id, username) is unique."""
        u = AppUser(
            tenant_id=tenant_id,
            username=username.strip(),
            email=email.strip() if email else None,
            password_hash=password_hash,
            is_active=True,
        )
        self.db.add(u)
        await self.db.flush()
        await self.db.refresh(u)
        return _to_result(u)
