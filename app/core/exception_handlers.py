"""Central exception to HTTP response mapping."""

from fastapi import Request
from fastapi.responses import JSONResponse

from app.domain.exceptions import (
    HmsException,
    ResourceNotFoundException,
    SqlNotConfiguredException,
    ValidationException,
)

_ERROR_CODE_STATUS = {
    "SQL_NOT_CONFIGURED": 503,
    "RESOURCE_NOT_FOUND": 404,
    "VALIDATION_ERROR": 422,
    "INTERNAL_ERROR": 500,
}


def _status_for(exc: HmsException) -> int:
    return _ERROR_CODE_STATUS.get(exc.error_code, 500)


async def hms_exception_handler(request: Request, exc: HmsException) -> JSONResponse:
    """Map HmsException to JSON response."""
    status = _status_for(exc)
    return JSONResponse(
        status_code=status,
        content={"detail": exc.message, "error_code": exc.error_code},
    )


async def validation_exception_handler(
    request: Request, exc: ValidationException
) -> JSONResponse:
    """Map ValidationException to 422."""
    return JSONResponse(
        status_code=422,
        content={"detail": exc.message, "error_code": exc.error_code, "field": getattr(exc, "field", None)},
    )


async def sql_not_configured_handler(
    request: Request, exc: SqlNotConfiguredException
) -> JSONResponse:
    """Map SqlNotConfiguredException to 503."""
    return JSONResponse(
        status_code=503,
        content={"detail": exc.message, "error_code": exc.error_code},
    )
