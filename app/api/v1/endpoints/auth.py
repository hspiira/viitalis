"""Auth API: POST /auth/login. No X-Tenant-ID required for login."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.dependencies import get_auth_service
from app.application.use_cases.auth import AuthService
from app.domain.exceptions import ValidationException
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    svc: Annotated[AuthService, Depends(get_auth_service)],
):
    """Login with tenant_code, username, password. Returns JWT (include tenant_id in payload)."""
    try:
        token, _user = await svc.login(
            tenant_code=body.tenant_code,
            username=body.username,
            password=body.password,
        )
    except ValidationException as e:
        raise HTTPException(status_code=401, detail=e.message)
    return TokenResponse(access_token=token, token_type="bearer")
