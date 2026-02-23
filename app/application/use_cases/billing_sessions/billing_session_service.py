"""Billing session service: create, get, list, update, close, disable. Tenant-scoped."""

from app.application.dtos.billing_session import (
    BillingSessionCreate,
    BillingSessionResult,
    BillingSessionUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.billing_session_repo import (
    BillingSessionRepository,
)


class BillingSessionService:
    def __init__(self, repo: BillingSessionRepository) -> None:
        self.repo = repo

    async def create_session(self, data: BillingSessionCreate) -> BillingSessionResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Session name is required", field="name")
        return await self.repo.create(data)

    async def get_by_id(self, session_id: str) -> BillingSessionResult:
        s = await self.repo.get_by_id(session_id)
        if not s:
            raise ResourceNotFoundException("Billing session not found")
        return s

    async def list_sessions(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[BillingSessionResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit, status=status)

    async def update_session(
        self, session_id: str, data: BillingSessionUpdate
    ) -> BillingSessionResult:
        s = await self.repo.update(session_id, data)
        if not s:
            raise ResourceNotFoundException("Billing session not found")
        return s

    async def close_session(self, session_id: str) -> BillingSessionResult:
        """Close session: fail if unapproved claims in date range; else set status=closed and snapshot totals."""
        s = await self.get_by_id(session_id)
        if s.status != "open":
            raise ValidationException(
                "Only open sessions can be closed",
                field="status",
            )
        n_unapproved = await self.repo.count_unapproved_claims_in_range(
            s.from_date, s.to_date
        )
        if n_unapproved > 0:
            raise ValidationException(
                f"Cannot close session: {n_unapproved} claim(s) in date range are not approved",
                field="session_id",
            )
        count, total = await self.repo.snapshot_totals_in_range(
            s.from_date, s.to_date
        )
        updated = await self.repo.close_with_snapshot(
            session_id, total_claims=count, total_amount=total
        )
        if not updated:
            raise ResourceNotFoundException("Billing session not found")
        return updated

    async def disable_session(self, session_id: str) -> BillingSessionResult:
        s = await self.get_by_id(session_id)
        if s.status not in ("open", "closed"):
            raise ValidationException(
                "Session is already disabled or invalid",
                field="status",
            )
        updated = await self.repo.update(session_id, BillingSessionUpdate(status="disabled"))
        if not updated:
            raise ResourceNotFoundException("Billing session not found")
        return updated
