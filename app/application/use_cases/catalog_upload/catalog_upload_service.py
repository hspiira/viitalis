"""Bulk upload for catalog items (medicines, services, labs). Skip duplicates by code."""

from app.application.dtos.catalog import CatalogItemCreate
from app.infrastructure.persistence.repositories.catalog_repo import (
    LabRepository,
    MedicineRepository,
    ServiceMaintenanceRepository,
)


MAX_UPLOAD_BATCH = 500


async def _upload_catalog(
    repo: MedicineRepository | ServiceMaintenanceRepository | LabRepository,
    items: list[CatalogItemCreate],
) -> tuple[int, int, list[tuple[int, str]]]:
    """DRY: create items in batch, skip duplicate code. Returns (created, failed, errors)."""
    if len(items) > MAX_UPLOAD_BATCH:
        return (
            0,
            len(items),
            [(0, f"Batch size exceeds maximum {MAX_UPLOAD_BATCH}")],
        )
    created = 0
    errors: list[tuple[int, str]] = []
    for i, data in enumerate(items):
        if not data.name or not data.name.strip():
            errors.append((i, "Name is required"))
            continue
        if data.code and (await repo.exists_by_code(data.code.strip())):
            errors.append((i, f"Duplicate code: {data.code}"))
            continue
        try:
            await repo.create(data)
            created += 1
        except Exception as e:
            errors.append((i, str(e)))
    return (created, len(errors), errors)


class CatalogUploadService:
    """Bulk upload medicines, services, and labs. Conflict policy: skip duplicate code."""

    def __init__(
        self,
        medicine_repo: MedicineRepository,
        service_repo: ServiceMaintenanceRepository,
        lab_repo: LabRepository,
    ) -> None:
        self.medicine_repo = medicine_repo
        self.service_repo = service_repo
        self.lab_repo = lab_repo

    async def upload_medicines(
        self,
        items: list[CatalogItemCreate],
    ) -> tuple[int, int, list[tuple[int, str]]]:
        """Create medicines in batch. Skips rows with duplicate code (same tenant)."""
        return await _upload_catalog(self.medicine_repo, items)

    async def upload_services(
        self,
        items: list[CatalogItemCreate],
    ) -> tuple[int, int, list[tuple[int, str]]]:
        """Create services in batch. Skips rows with duplicate code (same tenant)."""
        return await _upload_catalog(self.service_repo, items)

    async def upload_labs(
        self,
        items: list[CatalogItemCreate],
    ) -> tuple[int, int, list[tuple[int, str]]]:
        """Create labs in batch. Skips rows with duplicate code (same tenant)."""
        return await _upload_catalog(self.lab_repo, items)
