import logging
import time
from typing import Callable


logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    """Simple request/response logging with duration.

    Logs at INFO level. In development, ensure LOGGING level allows INFO to see output.
    """

    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        try:
            logger.info("[REQUEST] %s %s", request.method, request.path)
        except Exception:
            # Never fail the request because of logging
            pass

        response = self.get_response(request)

        try:
            duration = time.time() - start_time
            logger.info(
                "[RESPONSE] %s %s Status: %s Duration: %.2fs",
                request.method,
                request.path,
                getattr(response, "status_code", "-"),
                duration,
            )
        except Exception:
            pass

        return response
