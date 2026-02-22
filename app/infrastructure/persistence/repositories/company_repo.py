"""Company repository. Tenant-scoped: all queries filter by tenant_id."""

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.company import CompanyCreate, CompanyResult, CompanyUpdate
from app.infrastructure.persistence.models.company import Company
from app.infrastructure.persistence.models.member import Member


def _company_to_result(c: Company) -> CompanyResult:
    """Map ORM Company to CompanyResult."""
    return CompanyResult(
        id=c.id,
        tenant_id=c.tenant_id,
        code=c.code,
        name=c.name,
        contact_person=c.contact_person,
        address=c.address,
        phone=c.phone,
        email=c.email,
        website=c.website,
        remarks=c.remarks,
        location=c.location,
        district_id=c.district_id,
        company_type=c.company_type,
        status=c.status,
    )


class CompanyRepository:
    """Company repository. All access scoped to tenant_id."""

    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, company_id: str) -> CompanyResult | None:
        """Return company by ID (within tenant)."""
        result = await self.db.execute(
            select(Company).where(
                Company.id == company_id,
                Company.tenant_id == self.tenant_id,
            )
        )
        company = result.scalar_one_or_none()
        return _company_to_result(company) if company else None

    async def get_by_code(self, code: str) -> CompanyResult | None:
        """Return company by code (within tenant). For legacy identifier lookup."""
        if not code or not code.strip():
            return None
        result = await self.db.execute(
            select(Company).where(
                Company.tenant_id == self.tenant_id,
                Company.code == code.strip(),
            )
        )
        company = result.scalar_one_or_none()
        return _company_to_result(company) if company else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, code: str | None = None
    ) -> list[CompanyResult]:
        """Return companies for the tenant with pagination. Optional filter by code."""
        q = select(Company).where(Company.tenant_id == self.tenant_id)
        if code is not None and code.strip():
            q = q.where(Company.code == code.strip())
        result = await self.db.execute(
            q.offset(skip).limit(limit).order_by(Company.name)
        )
        companies = result.scalars().all()
        return [_company_to_result(c) for c in companies]

    async def create(self, data: CompanyCreate) -> CompanyResult:
        """Create a company (tenant_id from repo scope). id optional (e.g. legacy code)."""
        attrs: dict = {
            "tenant_id": self.tenant_id,
            "name": data.name.strip(),
            "code": data.code.strip() if data.code else None,
            "contact_person": data.contact_person.strip() if data.contact_person else None,
            "address": data.address.strip() if data.address else None,
            "phone": data.phone.strip() if data.phone else None,
            "email": data.email.strip() if data.email else None,
            "website": data.website.strip() if data.website else None,
            "remarks": data.remarks.strip() if data.remarks else None,
            "location": data.location.strip() if data.location else None,
            "district_id": data.district_id,
            "company_type": data.company_type,
            "status": (data.status or "active").strip() if data.status else "active",
        }
        if data.id and data.id.strip():
            attrs["id"] = data.id.strip()
        company = Company(**attrs)
        self.db.add(company)
        await self.db.flush()
        await self.db.refresh(company)
        return _company_to_result(company)

    async def update(
        self, company_id: str, data: CompanyUpdate
    ) -> CompanyResult | None:
        """Update a company. Returns updated company or None if not found."""
        result = await self.db.execute(
            select(Company).where(
                Company.id == company_id,
                Company.tenant_id == self.tenant_id,
            )
        )
        company = result.scalar_one_or_none()
        if not company:
            return None
        if data.name is not None:
            company.name = data.name.strip()
        if data.code is not None:
            company.code = data.code.strip() or None
        if data.contact_person is not None:
            company.contact_person = data.contact_person.strip() or None
        if data.address is not None:
            company.address = data.address.strip() or None
        if data.phone is not None:
            company.phone = data.phone.strip() or None
        if data.email is not None:
            company.email = data.email.strip() or None
        if data.website is not None:
            company.website = data.website.strip() or None
        if data.remarks is not None:
            company.remarks = data.remarks.strip() or None
        if data.location is not None:
            company.location = data.location.strip() or None
        if data.district_id is not None:
            company.district_id = data.district_id
        if data.company_type is not None:
            company.company_type = data.company_type
        if data.status is not None:
            company.status = data.status.strip() or "active"
        await self.db.flush()
        await self.db.refresh(company)
        return _company_to_result(company)

    async def count_members(self, company_id: str) -> int:
        """Return number of (non-deleted) members for this company in this tenant."""
        r = await self.db.execute(
            select(func.count(Member.id)).where(
                Member.tenant_id == self.tenant_id,
                Member.company_id == company_id,
                Member.deleted_at.is_(None),
            )
        )
        return r.scalar_one_or_none() or 0

    async def delete(self, company_id: str) -> bool:
        """Delete company by ID. Returns True if found and deleted."""
        result = await self.db.execute(
            delete(Company).where(
                Company.id == company_id,
                Company.tenant_id == self.tenant_id,
            )
        )
        return result.rowcount > 0
