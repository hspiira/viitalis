"""Department repository. Tenant-scoped CRUD."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.reference_data import (
    DepartmentCreate,
    DepartmentResult,
    DepartmentUpdate,
)
from app.infrastructure.persistence.models.department import Department


def _to_result(d: Department) -> DepartmentResult:
    return DepartmentResult(
        id=d.id,
        tenant_id=d.tenant_id,
        name=d.name,
        code=d.code,
        status=d.status,
    )


class DepartmentRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, entity_id: str) -> DepartmentResult | None:
        r = await self.db.execute(
            select(Department).where(
                Department.id == entity_id,
                Department.tenant_id == self.tenant_id,
            )
        )
        d = r.scalar_one_or_none()
        return _to_result(d) if d else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[DepartmentResult]:
        q = select(Department).where(Department.tenant_id == self.tenant_id)
        if status is not None:
            q = q.where(Department.status == status)
        q = q.offset(skip).limit(limit).order_by(Department.name)
        r = await self.db.execute(q)
        return [_to_result(d) for d in r.scalars().all()]

    async def create(self, data: DepartmentCreate) -> DepartmentResult:
        d = Department(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            code=data.code.strip() if data.code else None,
            status=data.status,
        )
        self.db.add(d)
        await self.db.flush()
        await self.db.refresh(d)
        return _to_result(d)

    async def update(
        self, entity_id: str, data: DepartmentUpdate
    ) -> DepartmentResult | None:
        r = await self.db.execute(
            select(Department).where(
                Department.id == entity_id,
                Department.tenant_id == self.tenant_id,
            )
        )
        d = r.scalar_one_or_none()
        if not d:
            return None
        if data.name is not None:
            d.name = data.name.strip()
        if data.code is not None:
            d.code = data.code.strip() or None
        if data.status is not None:
            d.status = data.status
        await self.db.flush()
        await self.db.refresh(d)
        return _to_result(d)
