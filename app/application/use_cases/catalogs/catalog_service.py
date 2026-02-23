"""Generic catalog service (Medicine, Service, Lab, Diagnosis). Delegates to repo."""

from app.application.dtos.catalog import (
    CatalogItemCreate,
    CatalogItemResult,
    CatalogItemUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException


class CatalogService:
    """CRUD for a catalog entity. Inject the appropriate repo."""

    def __init__(self, repo) -> None:
        self.repo = repo

    async def create(self, data: CatalogItemCreate) -> CatalogItemResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Name is required", field="name")
        return await self.repo.create(data)

    async def get_by_id(self, item_id: str) -> CatalogItemResult:
        item = await self.repo.get_by_id(item_id)
        if not item:
            raise ResourceNotFoundException("Item not found")
        return item

    async def list_items(
        self, skip: int = 0, limit: int = 100
    ) -> list[CatalogItemResult]:
        return await self.repo.list_by_tenant(skip=skip, limit=limit)

    async def update(self, item_id: str, data: CatalogItemUpdate) -> CatalogItemResult:
        updated = await self.repo.update(item_id, data)
        if not updated:
            raise ResourceNotFoundException("Item not found")
        return updated
