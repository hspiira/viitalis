"""User permissions service: list permissions for user with module info."""

from app.application.dtos.user import PermissionWithModuleResult
from app.infrastructure.persistence.repositories.app_module_repo import (
    AppModuleRepository,
)
from app.infrastructure.persistence.repositories.app_permission_repo import (
    AppPermissionRepository,
)


class UserPermissionsService:
    def __init__(
        self,
        permission_repo: AppPermissionRepository,
        module_repo: AppModuleRepository,
    ) -> None:
        self.permission_repo = permission_repo
        self.module_repo = module_repo

    async def list_for_user(
        self, user_id: str
    ) -> list[PermissionWithModuleResult]:
        permissions = await self.permission_repo.list_by_user_id(user_id)
        result = []
        for p in permissions:
            module = await self.module_repo.get_by_id(p.module_id)
            result.append(
                PermissionWithModuleResult(
                    id=p.id,
                    user_id=p.user_id,
                    module_id=p.module_id,
                    module_code=module.code if module else "",
                    module_name=module.name if module else "",
                    can_view=p.can_view,
                    can_create=p.can_create,
                    can_edit=p.can_edit,
                    can_delete=p.can_delete,
                    can_approve=p.can_approve,
                )
            )
        return result
