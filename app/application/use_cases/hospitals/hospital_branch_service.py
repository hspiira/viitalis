"""Hospital branch service: CRUD. Tenant-scoped."""

from app.application.dtos.hospital import (
    HospitalBranchCreate,
    HospitalBranchResult,
    HospitalBranchUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException


class HospitalBranchService:
    def __init__(self, branch_repo) -> None:
        self.repo = branch_repo

    async def create(self, data: HospitalBranchCreate) -> HospitalBranchResult:
        if not data.name or not data.name.strip():
            raise ValidationException("Branch name is required", field="name")
        if not data.hospital_id or not data.hospital_id.strip():
            raise ValidationException("Branch must belong to a hospital", field="hospital_id")
        return await self.repo.create(data)

    async def get_by_id(self, branch_id: str) -> HospitalBranchResult:
        b = await self.repo.get_by_id(branch_id)
        if not b:
            raise ResourceNotFoundException("Hospital branch not found")
        return b

    async def list_by_hospital(
        self, hospital_id: str, skip: int = 0, limit: int = 100
    ) -> list[HospitalBranchResult]:
        return await self.repo.list_by_hospital(
            hospital_id=hospital_id, skip=skip, limit=limit
        )

    async def update(
        self, branch_id: str, data: HospitalBranchUpdate
    ) -> HospitalBranchResult:
        updated = await self.repo.update(branch_id, data)
        if not updated:
            raise ResourceNotFoundException("Hospital branch not found")
        return updated
