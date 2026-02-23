from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    AppointmentViewSet,
    BedTransferViewSet,
    BedViewSet,
    DashboardStatsAPIView,
    DoctorLeaveViewSet,
    DoctorScheduleViewSet,
    DoctorViewSet,
    LabTestViewSet,
    LogoutAPIView,
    MeAPIView,
    PatientViewSet,
    RegisterAPIView,
    WardViewSet,
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patients')
router.register(r'doctors', DoctorViewSet, basename='doctors')
router.register(r'doctor-schedules', DoctorScheduleViewSet, basename='doctor-schedules')
router.register(r'doctor-leaves', DoctorLeaveViewSet, basename='doctor-leaves')
router.register(r'appointments', AppointmentViewSet, basename='appointments')
router.register(r'lab-tests', LabTestViewSet, basename='lab-tests')
router.register(r'wards', WardViewSet, basename='wards')
router.register(r'beds', BedViewSet, basename='beds')
router.register(r'bed-transfers', BedTransferViewSet, basename='bed-transfers')

urlpatterns = [
    path('auth/register/', RegisterAPIView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutAPIView.as_view(), name='logout'),
    path('auth/me/', MeAPIView.as_view(), name='me'),
    path('dashboard/stats/', DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    path('', include(router.urls)),
]
