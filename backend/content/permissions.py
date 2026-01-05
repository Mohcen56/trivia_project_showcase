from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Allow owners to edit, others can only read."""

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        # Instance must have an attribute named `created_by`
        return getattr(obj, 'created_by', None) == getattr(request, 'user', None)


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow only the owner of the object or admins to access/modify it."""

    def has_object_permission(self, request, view, obj):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return getattr(obj, 'created_by', None) == user or user.is_staff
