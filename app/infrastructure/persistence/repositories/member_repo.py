"""Member repository. Tenant-scoped; excludes soft-deleted by default."""

from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.member import MemberCreate, MemberResult, MemberUpdate
from app.infrastructure.persistence.models.member import Member


async def _exists_by_card_no(
    db: AsyncSession,
    tenant_id: str,
    card_no: str,
    exclude_member_id: str | None = None,
) -> bool:
    """Return True if another member (same tenant) has this card_no."""
    q = select(Member.id).where(
        Member.tenant_id == tenant_id,
        Member.card_no == card_no.strip(),
        Member.deleted_at.is_(None),
    )
    if exclude_member_id:
        q = q.where(Member.id != exclude_member_id)
    r = await db.execute(q.limit(1))
    return r.scalar_one_or_none() is not None


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
        employee_no=m.employee_no,
        gender=m.gender,
        address=m.address,
        tel_home=m.tel_home,
        tel_mobile=m.tel_mobile,
        email=m.email,
        department=m.department,
        branch=m.branch,
        occupation=m.occupation,
        date_of_joining=m.date_of_joining,
        date_of_leaving=m.date_of_leaving,
        remarks=m.remarks,
        extra=m.extra,
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

    async def exists_by_card_no(
        self, card_no: str, exclude_member_id: str | None = None
    ) -> bool:
        """True if another member in this tenant has this card_no (excludes soft-deleted)."""
        return await _exists_by_card_no(
            self.db, self.tenant_id, card_no, exclude_member_id=exclude_member_id
        )

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
            employee_no=data.employee_no.strip() if data.employee_no else None,
            gender=data.gender.strip() if data.gender else None,
            address=data.address.strip() if data.address else None,
            tel_home=data.tel_home.strip() if data.tel_home else None,
            tel_mobile=data.tel_mobile.strip() if data.tel_mobile else None,
            email=data.email.strip() if data.email else None,
            department=data.department.strip() if data.department else None,
            branch=data.branch.strip() if data.branch else None,
            occupation=data.occupation.strip() if data.occupation else None,
            date_of_joining=data.date_of_joining,
            date_of_leaving=data.date_of_leaving,
            remarks=data.remarks.strip() if data.remarks else None,
            extra=data.extra,
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
        if data.employee_no is not None:
            member.employee_no = data.employee_no.strip() or None
        if data.gender is not None:
            member.gender = data.gender.strip() or None
        if data.address is not None:
            member.address = data.address.strip() or None
        if data.tel_home is not None:
            member.tel_home = data.tel_home.strip() or None
        if data.tel_mobile is not None:
            member.tel_mobile = data.tel_mobile.strip() or None
        if data.email is not None:
            member.email = data.email.strip() or None
        if data.department is not None:
            member.department = data.department.strip() or None
        if data.branch is not None:
            member.branch = data.branch.strip() or None
        if data.occupation is not None:
            member.occupation = data.occupation.strip() or None
        if data.date_of_joining is not None:
            member.date_of_joining = data.date_of_joining
        if data.date_of_leaving is not None:
            member.date_of_leaving = data.date_of_leaving
        if data.remarks is not None:
            member.remarks = data.remarks.strip() or None
        if data.extra is not None:
            member.extra = data.extra
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
