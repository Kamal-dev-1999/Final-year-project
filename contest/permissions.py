from rest_framework import permissions
from logging import getLogger
import logging


logger = logging.getLogger('contest.views')


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
    Allows access to admins or the creator of the contest.
    """
    def has_permission(self, request, view):
        # Always allow GET, HEAD, or OPTIONS requests
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Allow admins to perform any action
        if hasattr(request.user, 'role') and request.user.role == 'ADMIN':
            logger.info(f"Admin user {request.user} granted access to {view.__class__.__name__}")
            return True
            
        return False
            
    def has_object_permission(self, request, view, obj):
        # Always allow read-only methods
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Allow admins to edit any contest
        if hasattr(request.user, 'role') and request.user.role == 'ADMIN':
            logger.info(f"Admin user {request.user} granted access to {obj.__class__.__name__} {obj.id}")
            return True
            
        # Allow contest creator to edit their own contest
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
            
        logger.warning(f"Access denied for user {request.user} to {obj.__class__.__name__} {obj.id}")
        return False
