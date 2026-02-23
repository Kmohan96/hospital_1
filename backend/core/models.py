from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        DOCTOR = 'doctor', 'Doctor'
        RECEPTIONIST = 'receptionist', 'Receptionist'

    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.RECEPTIONIST)


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Patient(TimeStampedModel):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField()
    gender = models.CharField(max_length=20)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField()
    blood_group = models.CharField(max_length=5, blank=True)
    emergency_contact = models.CharField(max_length=20, blank=True)
    medical_history = models.TextField(blank=True)
    discharge_summary = models.TextField(blank=True)
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='registered_patients')

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Doctor(TimeStampedModel):
    user = models.OneToOneField('User', on_delete=models.CASCADE, related_name='doctor_profile')
    specialization = models.CharField(max_length=120)
    qualification = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=20)
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class DoctorSchedule(TimeStampedModel):
    class WeekDay(models.TextChoices):
        MONDAY = 'monday', 'Monday'
        TUESDAY = 'tuesday', 'Tuesday'
        WEDNESDAY = 'wednesday', 'Wednesday'
        THURSDAY = 'thursday', 'Thursday'
        FRIDAY = 'friday', 'Friday'
        SATURDAY = 'saturday', 'Saturday'
        SUNDAY = 'sunday', 'Sunday'

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')
    day = models.CharField(max_length=20, choices=WeekDay.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)


class DoctorLeave(TimeStampedModel):
    class LeaveStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='leaves')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=LeaveStatus.choices, default=LeaveStatus.PENDING)


class Appointment(TimeStampedModel):
    class AppointmentStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        CANCELLED = 'cancelled', 'Cancelled'
        COMPLETED = 'completed', 'Completed'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.Roles.DOCTOR},
        related_name='doctor_appointments',
    )
    appointment_date = models.DateTimeField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=AppointmentStatus.choices, default=AppointmentStatus.PENDING)
    token_number = models.PositiveIntegerField(default=1)
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='appointments_created')

    class Meta:
        ordering = ['appointment_date']
        unique_together = ('doctor', 'appointment_date', 'token_number')


class LabTest(TimeStampedModel):
    class LabStatus(models.TextChoices):
        BOOKED = 'booked', 'Booked'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='lab_tests')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='lab_tests')
    test_name = models.CharField(max_length=120)
    booked_at = models.DateTimeField()
    result_summary = models.TextField(blank=True)
    report_file = models.FileField(upload_to='lab_reports/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=LabStatus.choices, default=LabStatus.BOOKED)


class Ward(TimeStampedModel):
    name = models.CharField(max_length=120)
    ward_type = models.CharField(max_length=80)
    total_beds = models.PositiveIntegerField(default=0)


class Bed(TimeStampedModel):
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE, related_name='beds')
    bed_number = models.CharField(max_length=50)
    is_icu = models.BooleanField(default=False)
    is_occupied = models.BooleanField(default=False)
    current_patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name='allocated_beds')

    class Meta:
        unique_together = ('ward', 'bed_number')


class BedTransfer(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='bed_transfers')
    from_bed = models.ForeignKey(Bed, on_delete=models.SET_NULL, null=True, blank=True, related_name='transfers_out')
    to_bed = models.ForeignKey(Bed, on_delete=models.CASCADE, related_name='transfers_in')
    reason = models.TextField(blank=True)
    transferred_at = models.DateTimeField(auto_now_add=True)
