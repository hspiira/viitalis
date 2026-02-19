"""Base exceptions for HMS application.

Mapped to HTTP in core.exception_handlers.
"""


class HmsException(Exception):
    """Base exception for HMS; subclasses carry error_code for HTTP mapping."""

    def __init__(self, message: str, error_code: str = "INTERNAL_ERROR") -> None:
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class SqlNotConfiguredException(HmsException):
    """Raised when DATABASE_URL / DATABASE_BACKEND is not set for SQL operations."""

    def __init__(self, message: str | None = None) -> None:
        super().__init__(
            message or "SQL database not configured. Set DATABASE_BACKEND and DATABASE_URL.",
            error_code="SQL_NOT_CONFIGURED",
        )


class ValidationException(HmsException):
    """Domain or input validation failed."""

    def __init__(self, message: str, field: str | None = None) -> None:
        self.field = field
        super().__init__(message, error_code="VALIDATION_ERROR")


class ResourceNotFoundException(HmsException):
    """Requested resource not found."""

    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, error_code="RESOURCE_NOT_FOUND")
