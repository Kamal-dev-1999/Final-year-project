from django.urls import path
from .views import AdminTokenObtainPairView, UserInfoView
from rest_framework_simplejwt.views import TokenRefreshView
from .views import AdminSignupView

urlpatterns = [
    path('signup/', AdminSignupView.as_view(), name='admin_signup'),
    path('token/', AdminTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserInfoView.as_view(), name='user_info'),
]