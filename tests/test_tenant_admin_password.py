"""Test that tenant creation with admin stores a password that can be verified at login."""
import pytest

from app.application.dtos.tenant import TenantCreate, TenantResult
from app.application.dtos.user import UserResult
from app.application.use_cases.tenants.tenant_service import TenantService
from app.infrastructure.security.password import verify_password
from app.schemas.tenant import TenantCreateRequest


def test_tenant_create_request_keeps_admin_password():
    """Request schema must retain admin_password so it can be passed to the service."""
    body = TenantCreateRequest(
        code="acme",
        name="Acme",
        status="active",
        admin_username="admin",
        admin_password="MySecretPass123",
        admin_email="admin@acme.com",
    )
    assert body.admin_password == "MySecretPass123"
    assert body.admin_username == "admin"


@pytest.mark.asyncio
async def test_tenant_create_with_admin_stores_verifiable_password():
    """Create tenant with admin_username/admin_password; stored hash must verify with same password."""
    tenant_result = TenantResult(id="t1", code="acme", name="Acme", status="active")
    captured_password_hash = None

    class MockTenantRepo:
        async def get_by_id(self, tenant_id: str):
            return tenant_result if tenant_id == "t1" else None

        async def get_by_code(self, code: str):
            return None

        async def list_all(self, skip: int = 0, limit: int = 100):
            return [tenant_result]

        async def create(self, data: TenantCreate) -> TenantResult:
            return tenant_result

    class MockUserRepo:
        async def create(
            self,
            tenant_id: str,
            username: str,
            email: str | None,
            password_hash: str,
        ) -> UserResult:
            nonlocal captured_password_hash
            captured_password_hash = password_hash
            return UserResult(
                id="u1",
                tenant_id=tenant_id,
                username=username,
                email=email,
                is_active=True,
            )

    class MockModuleRepo:
        async def list_all(self, skip: int = 0, limit: int = 200, status: str | None = "active"):
            return []

    class MockPermissionRepo:
        async def create(self, user_id: str, module_id: str, **kwargs):
            pass

    tenant_repo = MockTenantRepo()
    user_repo = MockUserRepo()
    module_repo = MockModuleRepo()
    permission_repo = MockPermissionRepo()

    service = TenantService(
        tenant_repo,
        user_repo=user_repo,
        module_repo=module_repo,
        permission_repo=permission_repo,
    )

    admin_password = "SecurePass123"
    data = TenantCreate(code="acme", name="Acme", status="active")
    await service.create_tenant(
        data,
        admin_username="admin",
        admin_password=admin_password,
        admin_email=None,
    )

    assert captured_password_hash is not None, "user_repo.create should have been called with a password hash"
    assert verify_password(admin_password, captured_password_hash), (
        "Stored password hash must verify with the same password (login would otherwise fail)"
    )
