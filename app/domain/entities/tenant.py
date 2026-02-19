"""Tenant domain entity.

Represents the business concept of a tenant, independent of persistence.
"""

from dataclasses import dataclass

from app.domain.enums import TenantStatus
from app.domain.exceptions import ValidationException


@dataclass
class TenantEntity:
    """Domain entity for tenant. Encapsulates lifecycle and validation."""

    id: str
    code: str
    name: str
    status: TenantStatus

    def __post_init__(self) -> None:
        self.validate()

    def validate(self) -> None:
        """Validate tenant business rules. Raises ValidationException if invalid."""
        if not self.id or not self.id.strip():
            raise ValidationException("Tenant ID is required", field="id")
        if not self.code or not self.code.strip():
            raise ValidationException("Tenant code is required", field="code")
        if not self.name or not self.name.strip():
            raise ValidationException("Tenant name is required", field="name")

    def can_accept_requests(self) -> bool:
        """Return whether this tenant is allowed to accept API traffic."""
        return self.status == TenantStatus.ACTIVE
