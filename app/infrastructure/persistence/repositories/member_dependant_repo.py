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
        card_no=d.card_no,
        dob=d.dob,
        relationship=d.relationship_type,
        gender=d.gender,
        address=d.address,
        tel_home=d.tel_home,
        tel_mobile=d.tel_mobile,
        status=d.status,
        next_of_kin=d.next_of_kin,
        extra=d.extra,
    )


async def _dependant_exists_by_card_no(
    db: AsyncSession,
    tenant_id: str,
    card_no: str,
    exclude_dependant_id: str | None = None,
) -> bool:
    """Return True if another dependant (same tenant) has this card_no."""
    q = select(MemberDependant.id).where(
        MemberDependant.tenant_id == tenant_id,
        MemberDependant.card_no == card_no.strip(),
        MemberDependant.deleted_at.is_(None),
    )
    if exclude_dependant_id:
        q = q.where(MemberDependant.id != exclude_dependant_id)
    r = await db.execute(q.limit(1))
    return r.scalar_one_or_none() is not None


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

    async def exists_by_card_no(
        self, card_no: str, exclude_dependant_id: str | None = None
    ) -> bool:
        """True if another dependant in this tenant has this card_no (when card_no is set)."""
        if not card_no or not card_no.strip():
            return False
        return await _dependant_exists_by_card_no(
            self.db, self.tenant_id, card_no, exclude_dependant_id=exclude_dependant_id
        )

    async def create(self, data: MemberDependantCreate) -> MemberDependantResult:
        """Create a dependant (tenant_id from repo scope)."""
        dep = MemberDependant(
            tenant_id=self.tenant_id,
            member_id=data.member_id,
            name=data.name.strip(),
            card_no=data.card_no.strip() if data.card_no else None,
            dob=data.dob,
            relationship_type=data.relationship.strip() if data.relationship else None,
            gender=data.gender.strip() if data.gender else None,
            address=data.address.strip() if data.address else None,
            tel_home=data.tel_home.strip() if data.tel_home else None,
            tel_mobile=data.tel_mobile.strip() if data.tel_mobile else None,
            status=data.status.strip() if data.status else None,
            next_of_kin=data.next_of_kin.strip() if data.next_of_kin else None,
            extra=data.extra,
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
        if data.card_no is not None:
            dep.card_no = data.card_no.strip() or None
        if data.dob is not None:
            dep.dob = data.dob
        if data.relationship is not None:
            dep.relationship_type = data.relationship.strip() or None
        if data.gender is not None:
            dep.gender = data.gender.strip() or None
        if data.address is not None:
            dep.address = data.address.strip() or None
        if data.tel_home is not None:
            dep.tel_home = data.tel_home.strip() or None
        if data.tel_mobile is not None:
            dep.tel_mobile = data.tel_mobile.strip() or None
        if data.status is not None:
            dep.status = data.status.strip() or None
        if data.next_of_kin is not None:
            dep.next_of_kin = data.next_of_kin.strip() or None
        if data.extra is not None:
            dep.extra = data.extra
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
