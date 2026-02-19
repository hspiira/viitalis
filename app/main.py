"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from scalar_fastapi import get_scalar_api_reference

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exception_handlers import (
    hms_exception_handler,
    sql_not_configured_handler,
    validation_exception_handler,
)
from app.domain.exceptions import (
    HmsException,
    ResourceNotFoundException,
    SqlNotConfiguredException,
    ValidationException,
)
from app.middleware import TenantContextMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan: startup/shutdown. Reserved for DB pool, cache, etc."""
    yield


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
        docs_url=None,  # Scalar API reference served at /docs below
    )
    app.add_middleware(TenantContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins.split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_exception_handler(HmsException, hms_exception_handler)
    app.add_exception_handler(ValidationException, validation_exception_handler)
    app.add_exception_handler(ResourceNotFoundException, hms_exception_handler)
    app.add_exception_handler(SqlNotConfiguredException, sql_not_configured_handler)
    app.include_router(api_router, prefix="/api/v1")

    static_dir = Path(__file__).resolve().parent / "static"
    hero_path = static_dir / "index.html"

    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    async def root():
        """Serve hero landing page at root."""
        if hero_path.exists():
            html = hero_path.read_text(encoding="utf-8")
            html = html.replace("{{ app_name }}", settings.app_name).replace(
                "{{ app_version }}", settings.app_version
            )
            return HTMLResponse(html)
        return HTMLResponse(
            "<h1>Vitalis</h1><p><a href='/docs'>API docs</a></p>",
            status_code=200,
        )

    @app.get("/docs", include_in_schema=False)
    async def scalar_html():
        return get_scalar_api_reference(
            openapi_url=app.openapi_url,
            title=f"{settings.app_name} API",
            scalar_proxy_url="https://proxy.scalar.com",
        )

    return app


app = create_app()
