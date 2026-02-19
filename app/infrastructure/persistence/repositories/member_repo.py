"""Member repository. Tenant-scoped; excludes soft-deleted by default."""

from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.member import MemberCreate, MemberResult, MemberUpdate
from app.infrastructure.persistence.models.member import Member


def _member_to_result(m: Member) -> MemberResult:
    """Map ORM Member to MemberResult."""
    return MemberResult(
        id=m.id,
        tenant_id=m.tenant_id,
        company_id=m.company_id,
        scheme_id=m.scheme_id,
        card_no=m.card_no,
        name=m.name,
        dob=m.dob,
        status=m.status,
    )


class MemberRepository:
    """Member repository. All access scoped to tenant_id; list/get exclude soft-deleted."""

    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, member_id: str) -> MemberResult | None:
        """Return member by ID (within tenant, not deleted)."""
        result = await self.db.execute(
            select(Member).where(
                Member.id == member_id,
                Member.tenant_id == self.tenant_id,
                Member.deleted_at.is_(None),
            )
        )
        member = result.scalar_one_or_none()
        return _member_to_result(member) if member else None

    async def list_by_tenant(
        self,
        skip: int = 0,
        limit: int = 100,
        company_id: str | None = None,
        scheme_id: str | None = None,
    ) -> list[MemberResult]:
        """Return members for the tenant with optional filters. Excludes soft-deleted."""
        q = select(Member).where(
            Member.tenant_id == self.tenant_id,
            Member.deleted_at.is_(None),
        )
        if company_id is not None:
            q = q.where(Member.company_id == company_id)
        if scheme_id is not None:
            q = q.where(Member.scheme_id == scheme_id)
        q = q.offset(skip).limit(limit).order_by(Member.name)
        result = await self.db.execute(q)
        members = result.scalars().all()
        return [_member_to_result(m) for m in members]

    async def create(self, data: MemberCreate) -> MemberResult:
        """Create a member (tenant_id from repo scope)."""
        member = Member(
            tenant_id=self.tenant_id,
            company_id=data.company_id,
            scheme_id=data.scheme_id,
            card_no=data.card_no.strip(),
            name=data.name.strip(),
            dob=data.dob,
            status=data.status,
        )
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return _member_to_result(member)

    async def update(self, member_id: str, data: MemberUpdate) -> MemberResult | None:
        """Update a member. Returns updated member or None if not found (or deleted)."""
        result = await self.db.execute(
            select(Member).where(
                Member.id == member_id,
                Member.tenant_id == self.tenant_id,
                Member.deleted_at.is_(None),
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            return None
        if data.card_no is not None:
            member.card_no = data.card_no.strip()
        if data.name is not None:
            member.name = data.name.strip()
        if data.dob is not None:
            member.dob = data.dob
        if data.status is not None:
            member.status = data.status
        await self.db.flush()
        await self.db.refresh(member)
        return _member_to_result(member)

    async def soft_delete(self, member_id: str) -> bool:
        """Soft-delete a member. Returns True if found and deleted."""
        result = await self.db.execute(
            update(Member)
            .where(
                Member.id == member_id,
                Member.tenant_id == self.tenant_id,
                Member.deleted_at.is_(None),
            )
            .values(deleted_at=datetime.now(timezone.utc))
        )
        return result.rowcount > 0
