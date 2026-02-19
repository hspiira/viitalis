"""Tenant lifecycle status."""

from enum import Enum


class TenantStatus(str, Enum):
    """Tenant status: active, suspended, archived."""

    ACTIVE = "active"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"

    @classmethod
    def values(cls) -> list[str]:
        """Return all valid status values as strings."""
        return [s.value for s in cls]
