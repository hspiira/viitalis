"""Health check endpoint."""

from fastapi import APIRouter
from fastapi.responses import RedirectResponse

router = APIRouter()


@router.get("", status_code=302)
async def health():
    """Redirect to the root landing page instead of returning JSON."""
    return RedirectResponse(url="/", status_code=302)
