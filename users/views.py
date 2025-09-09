# users/views.py

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import AdminTokenObtainPairSerializer, AdminRegistrationSerializer, UserSerializer
from .models import User

class UserInfoView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

# NEW: Add this view for Admin Registration
class AdminSignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminRegistrationSerializer
    permission_classes = [permissions.AllowAny] # Anyone can create an admin account


# This is your existing login view, no changes needed here.
class AdminTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view for Admins.
    Uses AdminTokenObtainPairSerializer to enforce admin-only login
    and handle single-device session logic.
    """
    serializer_class = AdminTokenObtainPairSerializer