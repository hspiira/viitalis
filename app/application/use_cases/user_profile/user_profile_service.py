"""User profile service: get current user with optional detail, update my detail."""

from app.application.dtos.user import (
    UserDetailCreate,
    UserDetailUpdate,
    UserWithDetailResult,
)
from app.infrastructure.persistence.repositories.app_user_detail_repo import (
    AppUserDetailRepository,
)
from app.infrastructure.persistence.repositories.app_user_repo import AppUserRepository


class UserProfileService:
    def __init__(
        self,
        user_repo: AppUserRepository,
        detail_repo: AppUserDetailRepository,
    ) -> None:
        self.user_repo = user_repo
        self.detail_repo = detail_repo

    async def get_user_with_detail(self, user_id: str) -> UserWithDetailResult | None:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return None
        detail = await self.detail_repo.get_by_user_id(user_id)
        return UserWithDetailResult(
            id=user.id,
            tenant_id=user.tenant_id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            full_name=detail.full_name if detail else None,
            phone=detail.phone if detail else None,
            avatar_url=detail.avatar_url if detail else None,
            remarks=detail.remarks if detail else None,
        )

    async def update_my_detail(
        self, user_id: str, data: UserDetailUpdate
    ) -> UserWithDetailResult | None:
        """Create or update profile detail for user. Returns updated user with detail."""
        existing = await self.detail_repo.get_by_user_id(user_id)
        if existing:
            await self.detail_repo.update(user_id, data)
        else:
            await self.detail_repo.create(
                UserDetailCreate(
                    user_id=user_id,
                    full_name=data.full_name,
                    phone=data.phone,
                    avatar_url=data.avatar_url,
                    remarks=data.remarks,
                )
            )
        return await self.get_user_with_detail(user_id)
