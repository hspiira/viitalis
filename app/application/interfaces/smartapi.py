"""SmartApi client interface (port for external integration). Optional."""

from typing import Protocol


class ISmartApiClient(Protocol):
    """Protocol for SmartApi external service. Stub implementation for tests."""

    async def create_member(self, tenant_id: str, payload: dict) -> dict:
        """Create or sync member to SmartApi."""
        ...

    async def activate_scheme(self, tenant_id: str, scheme_id: str) -> dict:
        """Activate scheme in SmartApi."""
        ...

    async def publish_reimbursement(
        self, tenant_id: str, reimbursement_id: str
    ) -> dict:
        """Publish reimbursement to SmartApi."""
        ...
