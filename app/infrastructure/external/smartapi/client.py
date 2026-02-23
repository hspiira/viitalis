"""Stub SmartApi client. Replace with HTTP client to real WCF/REST when required."""

from app.application.interfaces.smartapi import ISmartApiClient


class SmartApiClientStub:
    """Stub implementation of ISmartApiClient. No external calls."""

    async def create_member(self, tenant_id: str, payload: dict) -> dict:
        return {"status": "stub", "tenant_id": tenant_id}

    async def activate_scheme(self, tenant_id: str, scheme_id: str) -> dict:
        return {"status": "stub", "tenant_id": tenant_id, "scheme_id": scheme_id}

    async def publish_reimbursement(
        self, tenant_id: str, reimbursement_id: str
    ) -> dict:
        return {
            "status": "stub",
            "tenant_id": tenant_id,
            "reimbursement_id": reimbursement_id,
        }
