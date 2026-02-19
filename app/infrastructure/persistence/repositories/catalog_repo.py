"""Generic tenant-scoped catalog repository (Medicine, ServiceMaintenance, Lab, Diagnosis).

DRY: single implementation; concrete repos are created via make_catalog_repo(Model).
"""

from typing import TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.catalog import (
    CatalogItemCreate,
    CatalogItemResult,
    CatalogItemUpdate,
)

_CatalogModel = TypeVar("_CatalogModel")


def make_catalog_repo(model_class: type[_CatalogModel]):
    """Return a tenant-scoped CRUD repository class for a catalog model (id, tenant_id, name, code)."""

    def to_result(row: _CatalogModel) -> CatalogItemResult:
        return CatalogItemResult(
            id=row.id,
            tenant_id=row.tenant_id,
            name=row.name,
            code=row.code,
        )

    class _Repo:
        def __init__(self, db: AsyncSession, tenant_id: str) -> None:
            self._db = db
            self._tenant_id = tenant_id
            self._model = model_class

        async def get_by_id(self, item_id: str) -> CatalogItemResult | None:
            r = await self._db.execute(
                select(self._model).where(
                    self._model.id == item_id,
                    self._model.tenant_id == self._tenant_id,
                )
            )
            row = r.scalar_one_or_none()
            return to_result(row) if row else None

        async def exists_by_code(self, code: str) -> bool:
            if not code or not code.strip():
                return False
            r = await self._db.execute(
                select(self._model.id).where(
                    self._model.tenant_id == self._tenant_id,
                    self._model.code == code.strip(),
                ).limit(1)
            )
            return r.scalar_one_or_none() is not None

        async def list_by_tenant(
            self, skip: int = 0, limit: int = 100
        ) -> list[CatalogItemResult]:
            r = await self._db.execute(
                select(self._model)
                .where(self._model.tenant_id == self._tenant_id)
                .offset(skip)
                .limit(limit)
                .order_by(self._model.name)
            )
            return [to_result(row) for row in r.scalars().all()]

        async def create(self, data: CatalogItemCreate) -> CatalogItemResult:
            row = self._model(
                tenant_id=self._tenant_id,
                name=data.name.strip(),
                code=data.code.strip() if data.code else None,
            )
            self._db.add(row)
            await self._db.flush()
            await self._db.refresh(row)
            return to_result(row)

        async def update(
            self, item_id: str, data: CatalogItemUpdate
        ) -> CatalogItemResult | None:
            r = await self._db.execute(
                select(self._model).where(
                    self._model.id == item_id,
                    self._model.tenant_id == self._tenant_id,
                )
            )
            row = r.scalar_one_or_none()
            if not row:
                return None
            if data.name is not None:
                row.name = data.name.strip()
            if data.code is not None:
                row.code = data.code.strip() or None
            await self._db.flush()
            await self._db.refresh(row)
            return to_result(row)

    return _Repo


# Concrete catalog repositories (same interface, different model)
from app.infrastructure.persistence.models.diagnosis import Diagnosis
from app.infrastructure.persistence.models.lab import Lab
from app.infrastructure.persistence.models.medicine import Medicine
from app.infrastructure.persistence.models.service_maintenance import ServiceMaintenance

MedicineRepository = make_catalog_repo(Medicine)
ServiceMaintenanceRepository = make_catalog_repo(ServiceMaintenance)
LabRepository = make_catalog_repo(Lab)
DiagnosisRepository = make_catalog_repo(Diagnosis)
