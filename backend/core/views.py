from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework import decorators, permissions, response, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Appointment, Bed, BedTransfer, Doctor, DoctorLeave, DoctorSchedule, LabTest, Patient, Ward
from .permissions import IsAppointmentOwnerDoctorOrAdmin
from .serializers import (
    AppointmentSerializer,
    BedSerializer,
    BedTransferSerializer,
    DoctorLeaveSerializer,
    DoctorScheduleSerializer,
    DoctorSerializer,
    LabTestSerializer,
    PatientSerializer,
    RegisterSerializer,
    UserSerializer,
    WardSerializer,
)
from .utils import send_mock_sms

User = get_user_model()


class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response(serializer.data, status=status.HTTP_201_CREATED)


class MeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return response.Response(UserSerializer(request.user).data)


class LogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return response.Response({'detail': 'refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
        token = RefreshToken(refresh_token)
        token.blacklist()
        return response.Response({'detail': 'Logged out successfully'})


class BaseRoleViewSet(viewsets.ModelViewSet):
    allowed_write_roles = [User.Roles.ADMIN]

    def _can_write(self):
        return self.request.user.role in self.allowed_write_roles or self.request.user.is_superuser

    def create(self, request, *args, **kwargs):
        if not self._can_write():
            return response.Response({'detail': 'Insufficient role permissions'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not self._can_write():
            return response.Response({'detail': 'Insufficient role permissions'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not self._can_write():
            return response.Response({'detail': 'Insufficient role permissions'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self._can_write():
            return response.Response({'detail': 'Insufficient role permissions'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class PatientViewSet(BaseRoleViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    allowed_write_roles = [User.Roles.ADMIN, User.Roles.RECEPTIONIST, User.Roles.DOCTOR]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DoctorViewSet(BaseRoleViewSet):
    queryset = Doctor.objects.select_related('user').all()
    serializer_class = DoctorSerializer
    allowed_write_roles = [User.Roles.ADMIN]


class DoctorScheduleViewSet(BaseRoleViewSet):
    queryset = DoctorSchedule.objects.select_related('doctor', 'doctor__user').all()
    serializer_class = DoctorScheduleSerializer
    allowed_write_roles = [User.Roles.ADMIN, User.Roles.DOCTOR]


class DoctorLeaveViewSet(BaseRoleViewSet):
    queryset = DoctorLeave.objects.select_related('doctor', 'doctor__user').all()
    serializer_class = DoctorLeaveSerializer
    allowed_write_roles = [User.Roles.ADMIN, User.Roles.DOCTOR]


class AppointmentViewSet(BaseRoleViewSet):
    queryset = Appointment.objects.select_related('patient', 'doctor').all()
    serializer_class = AppointmentSerializer
    allowed_write_roles = [User.Roles.ADMIN, User.Roles.RECEPTIONIST]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == User.Roles.DOCTOR:
            return qs.filter(doctor=user)
        return qs

    def create(self, request, *args, **kwargs):
        if request.user.role not in [User.Roles.ADMIN, User.Roles.RECEPTIONIST] and not request.user.is_superuser:
            return response.Response({'detail': 'Only admin/receptionist can create appointments'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        if request.user.role == User.Roles.DOCTOR:
            return response.Response({'detail': 'Doctors cannot edit appointment payload directly'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if request.user.role == User.Roles.DOCTOR:
            return response.Response({'detail': 'Doctors cannot edit appointment payload directly'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role == User.Roles.DOCTOR:
            return response.Response({'detail': 'Doctors cannot delete appointments'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAppointmentOwnerDoctorOrAdmin])
    def approve(self, request, pk=None):
        instance = self.get_object()
        instance.status = Appointment.AppointmentStatus.APPROVED
        instance.save(update_fields=['status'])
        if instance.patient.email:
            send_mail('Appointment Approved', f'Your appointment #{instance.id} has been approved.', None, [instance.patient.email], fail_silently=True)
        if instance.patient.phone:
            send_mock_sms(instance.patient.phone, f'Appointment #{instance.id} approved.')
        return response.Response(self.get_serializer(instance).data)

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAppointmentOwnerDoctorOrAdmin])
    def reject(self, request, pk=None):
        instance = self.get_object()
        instance.status = Appointment.AppointmentStatus.REJECTED
        instance.save(update_fields=['status'])
        if instance.patient.email:
            send_mail('Appointment Rejected', f'Your appointment #{instance.id} has been rejected.', None, [instance.patient.email], fail_silently=True)
        if instance.patient.phone:
            send_mock_sms(instance.patient.phone, f'Appointment #{instance.id} rejected.')
        return response.Response(self.get_serializer(instance).data)

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAppointmentOwnerDoctorOrAdmin])
    def cancel(self, request, pk=None):
        instance = self.get_object()
        instance.status = Appointment.AppointmentStatus.CANCELLED
        instance.save(update_fields=['status'])
        return response.Response(self.get_serializer(instance).data)

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAppointmentOwnerDoctorOrAdmin])
    def complete(self, request, pk=None):
        instance = self.get_object()
        instance.status = Appointment.AppointmentStatus.COMPLETED
        instance.save(update_fields=['status'])
        return response.Response(self.get_serializer(instance).data)

    @decorators.action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsAppointmentOwnerDoctorOrAdmin], url_path='patient-detail')
    def patient_detail(self, request, pk=None):
        instance = self.get_object()
        payload = PatientSerializer(instance.patient).data
        return response.Response(payload)


class LabTestViewSet(BaseRoleViewSet):
    queryset = LabTest.objects.select_related('patient', 'doctor', 'doctor__user').all()
    serializer_class = LabTestSerializer
    parser_classes = [MultiPartParser, FormParser]
    allowed_write_roles = [User.Roles.ADMIN, User.Roles.RECEPTIONIST, User.Roles.DOCTOR]


class WardViewSet(BaseRoleViewSet):
    queryset = Ward.objects.all()
    serializer_class = WardSerializer
    allowed_write_roles = [User.Roles.ADMIN, User.Roles.RECEPTIONIST]


class BedViewSet(BaseRoleViewSet):
    queryset = Bed.objects.select_related('ward', 'current_patient').all()
    serializer_class = BedSerializer
    allowed_write_roles = [User.Roles.ADMIN, User.Roles.RECEPTIONIST]


class BedTransferViewSet(BaseRoleViewSet):
    queryset = BedTransfer.objects.select_related('patient', 'from_bed', 'to_bed').all()
    serializer_class = BedTransferSerializer
    allowed_write_roles = [User.Roles.ADMIN, User.Roles.RECEPTIONIST]


class DashboardStatsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        payload = {
            'total_patients': Patient.objects.count(),
            'total_doctors': Doctor.objects.count(),
            'total_appointments': Appointment.objects.count(),
            'beds_available': Bed.objects.filter(is_occupied=False).count(),
        }
        return response.Response(payload)
