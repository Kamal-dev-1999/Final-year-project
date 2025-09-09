from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContestViewSet, ProblemViewSet, ContestDetailView, ContestProblemView,
    ProblemDetailView, ProblemSubmissionView, SubmissionStatusView, 
    TestCaseViewSet, ViewProblemDetailView, SubmissionAnalyticsViewSet,
    UserActivityViewSet, PlagiarismCheckViewSet
)

router = DefaultRouter()
router.register(r'contests', ContestViewSet, basename='contest')
router.register(r'problems', ProblemViewSet, basename='problem')
router.register(r'testcases', TestCaseViewSet, basename='testcase')
router.register(r'analytics/submissions', SubmissionAnalyticsViewSet, basename='submission-analytics')

urlpatterns = [
    path('', include(router.urls)),
    path('contests/<int:id>/', ContestDetailView.as_view(), name='contest-detail'),
    path('contests/<int:contest_id>/problems/', ContestProblemView.as_view(), name='contest-problems'),
    path('problems/<int:id>/detail/', ProblemDetailView.as_view(), name='problem-detail'),
    path('problems/<int:problem_id>/submit/', ProblemSubmissionView.as_view(), name='problem-submit'),
    path('submissions/<int:id>/status/', SubmissionStatusView.as_view(), name='submission-status'),
    path('problems/<int:id>/view/', ViewProblemDetailView.as_view(), name='view-problem-detail'),
]
