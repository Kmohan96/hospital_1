from rest_framework.permissions import BasePermission


class IsRole(BasePermission):
    allowed_roles = []

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.role in self.allowed_roles


class IsAdminRole(IsRole):
    allowed_roles = ["admin"]


class IsDoctorRole(IsRole):
    allowed_roles = ["doctor"]


class IsReceptionistRole(IsRole):
    allowed_roles = ["receptionist"]


class IsAdminOrReceptionistRole(IsRole):
    allowed_roles = ["admin", "receptionist"]


class IsAdminOrDoctorRole(IsRole):
    allowed_roles = ["admin", "doctor"]


class IsAppointmentOwnerDoctorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser or user.role == "admin":
            return True
        return user.role == "doctor" and obj.doctor_id == user.id
