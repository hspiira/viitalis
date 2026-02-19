"""Benefit linkage repository. Tenant-scoped; duplicate check on create."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.benefit import BenefitLinkageCreate, BenefitLinkageResult
from app.infrastructure.persistence.models.benefit_linkage import BenefitLinkage


def _to_result(bl: BenefitLinkage) -> BenefitLinkageResult:
    return BenefitLinkageResult(
        id=bl.id,
        tenant_id=bl.tenant_id,
        benefit_id=bl.benefit_id,
        service_type=bl.service_type,
        catalog_item_id=bl.catalog_item_id,
    )


class BenefitLinkageRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def list_by_benefit(
        self, benefit_id: str, skip: int = 0, limit: int = 100
    ) -> list[BenefitLinkageResult]:
        r = await self.db.execute(
            select(BenefitLinkage)
            .where(
                BenefitLinkage.tenant_id == self.tenant_id,
                BenefitLinkage.benefit_id == benefit_id,
            )
            .offset(skip)
            .limit(limit)
            .order_by(BenefitLinkage.service_type, BenefitLinkage.catalog_item_id)
        )
        return [_to_result(bl) for bl in r.scalars().all()]

    async def exists_linkage(
        self, benefit_id: str, service_type: str, catalog_item_id: str
    ) -> bool:
        r = await self.db.execute(
            select(BenefitLinkage.id).where(
                BenefitLinkage.tenant_id == self.tenant_id,
                BenefitLinkage.benefit_id == benefit_id,
                BenefitLinkage.service_type == service_type,
                BenefitLinkage.catalog_item_id == catalog_item_id,
            ).limit(1)
        )
        return r.scalar_one_or_none() is not None

    async def create(
        self, data: BenefitLinkageCreate
    ) -> BenefitLinkageResult:
        bl = BenefitLinkage(
            tenant_id=self.tenant_id,
            benefit_id=data.benefit_id,
            service_type=data.service_type.strip().lower(),
            catalog_item_id=data.catalog_item_id.strip(),
        )
        self.db.add(bl)
        await self.db.flush()
        await self.db.refresh(bl)
        return _to_result(bl)

    async def get_by_id(self, linkage_id: str) -> BenefitLinkageResult | None:
        r = await self.db.execute(
            select(BenefitLinkage).where(
                BenefitLinkage.id == linkage_id,
                BenefitLinkage.tenant_id == self.tenant_id,
            )
        )
        bl = r.scalar_one_or_none()
        return _to_result(bl) if bl else None

    async def delete(self, linkage_id: str) -> bool:
        from sqlalchemy import delete as sql_delete
        result = await self.db.execute(
            sql_delete(BenefitLinkage).where(
                BenefitLinkage.id == linkage_id,
                BenefitLinkage.tenant_id == self.tenant_id,
            )
        )
        return result.rowcount > 0
