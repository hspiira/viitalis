"""Auth API: POST /auth/login, GET /auth/me. No X-Tenant-ID required for login."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.v1.dependencies import (
    get_app_user_log_repo,
    get_auth_service,
    get_current_user,
    get_user_permissions_service,
    get_user_profile_service,
)
from app.application.dtos.user import AppUserLogCreate, UserDetailUpdate, UserResult
from app.application.use_cases.auth import AuthService
from app.application.use_cases.user_profile import UserProfileService
from app.application.use_cases.user_permissions import UserPermissionsService
from app.domain.exceptions import ValidationException
from app.infrastructure.persistence.repositories.app_user_log_repo import (
    AppUserLogRepository,
)
from app.schemas.auth import (
    LoginRequest,
    MeResponse,
    MeUpdateRequest,
    PermissionResponse,
    TokenResponse,
)

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    body: LoginRequest,
    svc: Annotated[AuthService, Depends(get_auth_service)],
    log_repo: Annotated[AppUserLogRepository, Depends(get_app_user_log_repo)],
):
    """Login with tenant_code, username, password. Returns JWT. Logs action 'login'."""
    try:
        token, user = await svc.login(
            tenant_code=body.tenant_code,
            username=body.username,
            password=body.password,
        )
    except ValidationException as e:
        raise HTTPException(status_code=401, detail=e.message)
    ip = request.client.host if request.client else None
    await log_repo.create(
        AppUserLogCreate(
            user_id=user.id,
            tenant_id=user.tenant_id,
            action="login",
            module="auth",
            ip=ip,
        )
    )
    return TokenResponse(access_token=token, token_type="bearer")


@router.get("/me", response_model=MeResponse)
async def me(
    current_user: Annotated[UserResult, Depends(get_current_user)],
    profile_svc: Annotated[UserProfileService, Depends(get_user_profile_service)],
):
    """Return current user with optional profile detail. Requires Bearer token."""
    with_detail = await profile_svc.get_user_with_detail(current_user.id)
    if not with_detail:
        raise HTTPException(status_code=404, detail="User not found")
    return MeResponse(
        id=with_detail.id,
        tenant_id=with_detail.tenant_id,
        username=with_detail.username,
        email=with_detail.email,
        is_active=with_detail.is_active,
        full_name=with_detail.full_name,
        phone=with_detail.phone,
        avatar_url=with_detail.avatar_url,
        remarks=with_detail.remarks,
    )


@router.patch("/me", response_model=MeResponse)
async def update_me(
    current_user: Annotated[UserResult, Depends(get_current_user)],
    body: MeUpdateRequest,
    profile_svc: Annotated[UserProfileService, Depends(get_user_profile_service)],
):
    """Update current user profile detail (full_name, phone, avatar_url, remarks). Creates detail if missing."""
    data = UserDetailUpdate(
        full_name=body.full_name,
        phone=body.phone,
        avatar_url=body.avatar_url,
        remarks=body.remarks,
    )
    updated = await profile_svc.update_my_detail(current_user.id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return MeResponse(
        id=updated.id,
        tenant_id=updated.tenant_id,
        username=updated.username,
        email=updated.email,
        is_active=updated.is_active,
        full_name=updated.full_name,
        phone=updated.phone,
        avatar_url=updated.avatar_url,
        remarks=updated.remarks,
    )


@router.get("/me/permissions", response_model=list[PermissionResponse])
async def me_permissions(
    current_user: Annotated[UserResult, Depends(get_current_user)],
    permissions_svc: Annotated[
        UserPermissionsService, Depends(get_user_permissions_service)
    ],
):
    """List permissions for current user (module_code, module_name, can_* flags)."""
    perms = await permissions_svc.list_for_user(current_user.id)
    return [
        PermissionResponse(
            id=p.id,
            user_id=p.user_id,
            module_id=p.module_id,
            module_code=p.module_code,
            module_name=p.module_name,
            can_view=p.can_view,
            can_create=p.can_create,
            can_edit=p.can_edit,
            can_delete=p.can_delete,
            can_approve=p.can_approve,
        )
        for p in perms
    ]
