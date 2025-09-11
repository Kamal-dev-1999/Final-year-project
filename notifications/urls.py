from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailTemplateViewSet, BulkEmailTaskViewSet, EmailLogViewSet

router = DefaultRouter()
router.register(r'templates', EmailTemplateViewSet)
router.register(r'tasks', BulkEmailTaskViewSet)
router.register(r'logs', EmailLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
