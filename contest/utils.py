from rest_framework import permissions


def get_client_ip(request):
    """
    Get the client's IP address from the request.
    Handles cases where the request might be coming through a proxy.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # If request came through a proxy, get the original client IP
        ip = x_forwarded_for.split(',')[0]
    else:
        # Get the direct client IP
        ip = request.META.get('REMOTE_ADDR')
    return ip


class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class IsContestCreator(permissions.BasePermission):
    """
    Allows access only to the creator of the contest.
    """
    def has_object_permission(self, request, view, obj):
        # Allow admins to edit any contest
        if request.user.role == 'ADMIN':
            return True
            
        # For other users, check if they are the creator of the contest
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        return False
