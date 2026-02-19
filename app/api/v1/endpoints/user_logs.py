"""User logs API: list audit log by tenant. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_tenant_id, get_user_log_service
from app.application.use_cases.user_logs import UserLogService
from app.schemas.auth import UserLogResponse

router = APIRouter()


@router.get("", response_model=list[UserLogResponse])
async def list_user_logs(
    tenant_id: Annotated[str, Depends(get_tenant_id)],
    svc: Annotated[UserLogService, Depends(get_user_log_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    user_id: str | None = Query(None),
    action: str | None = Query(None),
):
    """List user action logs for the tenant (audit trail). Optional user_id, action filter."""
    items = await svc.list_by_tenant(
        tenant_id, skip=skip, limit=limit, user_id=user_id, action=action
    )
    return [
        UserLogResponse(
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
        for l in items
    ]
