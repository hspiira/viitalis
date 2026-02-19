"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    return app


app = create_app()
