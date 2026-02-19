"""Member dependant repository. Tenant-scoped; excludes soft-deleted by default."""

from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.member_dependant import (
    MemberDependantCreate,
    MemberDependantResult,
    MemberDependantUpdate,
)
from app.infrastructure.persistence.models.member_dependant import MemberDependant


def _dependant_to_result(d: MemberDependant) -> MemberDependantResult:
    """Map ORM MemberDependant to MemberDependantResult."""
    return MemberDependantResult(
        id=d.id,
        tenant_id=d.tenant_id,
        member_id=d.member_id,
        name=d.name,
        dob=d.dob,
    )


class MemberDependantRepository:
    """Member dependant repository. All access scoped to tenant_id; list/get exclude soft-deleted."""

    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, dependant_id: str) -> MemberDependantResult | None:
        """Return dependant by ID (within tenant, not deleted)."""
        result = await self.db.execute(
            select(MemberDependant).where(
                MemberDependant.id == dependant_id,
                MemberDependant.tenant_id == self.tenant_id,
                MemberDependant.deleted_at.is_(None),
            )
        )
        dep = result.scalar_one_or_none()
        return _dependant_to_result(dep) if dep else None

    async def list_by_member(
        self, member_id: str, skip: int = 0, limit: int = 100
    ) -> list[MemberDependantResult]:
        """Return dependants for a member. Excludes soft-deleted."""
        result = await self.db.execute(
            select(MemberDependant)
            .where(
                MemberDependant.tenant_id == self.tenant_id,
                MemberDependant.member_id == member_id,
                MemberDependant.deleted_at.is_(None),
            )
            .offset(skip)
            .limit(limit)
            .order_by(MemberDependant.name)
        )
        deps = result.scalars().all()
        return [_dependant_to_result(d) for d in deps]

    async def create(self, data: MemberDependantCreate) -> MemberDependantResult:
        """Create a dependant (tenant_id from repo scope)."""
        dep = MemberDependant(
            tenant_id=self.tenant_id,
            member_id=data.member_id,
            name=data.name.strip(),
            dob=data.dob,
        )
        self.db.add(dep)
        await self.db.flush()
        await self.db.refresh(dep)
        return _dependant_to_result(dep)

    async def update(
        self, dependant_id: str, data: MemberDependantUpdate
    ) -> MemberDependantResult | None:
        """Update a dependant. Returns updated dependant or None if not found (or deleted)."""
        result = await self.db.execute(
            select(MemberDependant).where(
                MemberDependant.id == dependant_id,
                MemberDependant.tenant_id == self.tenant_id,
                MemberDependant.deleted_at.is_(None),
            )
        )
        dep = result.scalar_one_or_none()
        if not dep:
            return None
        if data.name is not None:
            dep.name = data.name.strip()
        if data.dob is not None:
            dep.dob = data.dob
        await self.db.flush()
        await self.db.refresh(dep)
        return _dependant_to_result(dep)

    async def soft_delete(self, dependant_id: str) -> bool:
        """Soft-delete a dependant. Returns True if found and deleted."""
        result = await self.db.execute(
            update(MemberDependant)
            .where(
                MemberDependant.id == dependant_id,
                MemberDependant.tenant_id == self.tenant_id,
                MemberDependant.deleted_at.is_(None),
            )
            .values(deleted_at=datetime.now(timezone.utc))
        )
        return result.rowcount > 0
