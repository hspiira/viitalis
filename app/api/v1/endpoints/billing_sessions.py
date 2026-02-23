"""Billing sessions API: create, list, get, update, close, disable. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_billing_session_service
from app.application.dtos.billing_session import BillingSessionCreate, BillingSessionUpdate
from app.application.use_cases.billing_sessions import BillingSessionService
from app.schemas.billing_session import (
    BillingSessionCreateRequest,
    BillingSessionListItem,
    BillingSessionResponse,
    BillingSessionUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> BillingSessionResponse:
    """Map BillingSessionResult DTO to API response (DRY)."""
    return BillingSessionResponse.model_validate(r)


def _to_list_item(s) -> BillingSessionListItem:
    """Map BillingSessionResult to list item response (DRY)."""
    return BillingSessionListItem.model_validate(s)


@router.post("", response_model=BillingSessionResponse, status_code=201)
async def create_billing_session(
    body: BillingSessionCreateRequest,
    svc: Annotated[BillingSessionService, Depends(get_billing_session_service)],
):
    data = BillingSessionCreate(
        name=body.name,
        session_date=body.session_date,
        from_date=body.from_date,
        to_date=body.to_date,
        created_by=body.created_by,
    )
    created = await svc.create_session(data)
    return _to_response(created)


@router.get("", response_model=list[BillingSessionListItem])
async def list_billing_sessions(
    svc: Annotated[BillingSessionService, Depends(get_billing_session_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None, pattern="^(open|closed|disabled)$"),
):
    items = await svc.list_sessions(skip=skip, limit=limit, status=status)
    return [_to_list_item(s) for s in items]


@router.get("/{session_id}", response_model=BillingSessionResponse)
async def get_billing_session(
    session_id: str,
    svc: Annotated[BillingSessionService, Depends(get_billing_session_service)],
):
    s = await svc.get_by_id(session_id)
    return _to_response(s)


@router.patch("/{session_id}", response_model=BillingSessionResponse)
async def update_billing_session(
    session_id: str,
    body: BillingSessionUpdateRequest,
    svc: Annotated[BillingSessionService, Depends(get_billing_session_service)],
):
    data = BillingSessionUpdate(
        name=body.name,
        from_date=body.from_date,
        to_date=body.to_date,
        status=body.status,
    )
    updated = await svc.update_session(session_id, data)
    return _to_response(updated)


@router.post("/{session_id}/close", response_model=BillingSessionResponse)
async def close_billing_session(
    session_id: str,
    svc: Annotated[BillingSessionService, Depends(get_billing_session_service)],
):
    """Close session. Fails if any claims in date range are not approved."""
    s = await svc.close_session(session_id)
    return _to_response(s)


@router.post("/{session_id}/disable", response_model=BillingSessionResponse)
async def disable_billing_session(
    session_id: str,
    svc: Annotated[BillingSessionService, Depends(get_billing_session_service)],
):
    s = await svc.disable_session(session_id)
    return _to_response(s)
