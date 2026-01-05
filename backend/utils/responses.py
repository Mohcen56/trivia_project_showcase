from typing import Any, Optional

from rest_framework.response import Response
from rest_framework import status


def success_response(
    data: Any = None,
    message: Optional[str] = None,
    status_code: int = status.HTTP_200_OK,
) -> Response:
    """Standardized success response wrapper.

    Returns: {"success": True, "data": <payload>, "message"?: <str>}
    """
    payload = {
        "success": True,
        "data": data,
    }
    if message:
        payload["message"] = message
    return Response(payload, status=status_code)


def error_response(
    message: str,
    errors: Optional[Any] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> Response:
    """Standardized error response wrapper.

    Returns: {"success": False, "message": <str>, "errors"?: <details>}
    """
    payload = {
        "success": False,
        "message": message,
    }
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)
