"""Rate limiting for auth and API. Uses in-memory store by default."""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
