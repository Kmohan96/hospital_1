from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db.models import Max
from rest_framework import serializers

from .models import Appointment, Bed, BedTransfer, Doctor, DoctorLeave, DoctorSchedule, LabTest, Patient, Ward
from .utils import send_mock_sms

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role=User.Roles.DOCTOR), source='user', write_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'user', 'user_id', 'specialization', 'qualification', 'phone', 'bio', 'is_active', 'created_at', 'updated_at']


class DoctorScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSchedule
        fields = '__all__'


class DoctorLeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorLeave
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.__str__', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    patient_id = serializers.IntegerField(write_only=True, required=False)
    doctor_user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['token_number', 'created_by', 'created_at', 'updated_at']
        extra_kwargs = {
            'patient': {'required': False},
            'doctor': {'required': False, 'read_only': True},
        }

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() or obj.doctor.username

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None
        initial = self.initial_data

        if not attrs.get('patient'):
            patient_id = initial.get('patient_id')
            if patient_id is not None:
                try:
                    attrs['patient'] = Patient.objects.get(pk=patient_id)
                except Patient.DoesNotExist as exc:
                    raise serializers.ValidationError({'patient_id': 'Invalid patient_id'}) from exc

        if user and user.role == User.Roles.DOCTOR:
            attrs['doctor'] = user
        elif not attrs.get('doctor'):
            doctor_user_id = initial.get('doctor_user_id')
            if doctor_user_id is not None:
                try:
                    doctor_user = User.objects.get(pk=doctor_user_id, role=User.Roles.DOCTOR)
                    attrs['doctor'] = doctor_user
                except User.DoesNotExist as exc:
                    raise serializers.ValidationError({'doctor_user_id': 'Invalid doctor user id'}) from exc

        if not attrs.get('patient'):
            raise serializers.ValidationError({'patient': 'Provide patient or patient_id'})
        if not attrs.get('doctor'):
            raise serializers.ValidationError({'doctor': 'Provide doctor_user_id (admin/receptionist only)'})

        return attrs

    def create(self, validated_data):
        validated_data.pop('patient_id', None)
        validated_data.pop('doctor_user_id', None)
        doctor = validated_data['doctor']
        appointment_date = validated_data['appointment_date']
        daily_last_token = Appointment.objects.filter(
            doctor=doctor,
            appointment_date__date=appointment_date.date(),
        ).aggregate(max_token=Max('token_number'))['max_token'] or 0
        validated_data['token_number'] = daily_last_token + 1
        instance = super().create(validated_data)

        if instance.patient.email:
            send_mail(
                subject='Hospital Appointment Booked',
                message=f'Your token number is {instance.token_number} for {instance.appointment_date}.',
                from_email=None,
                recipient_list=[instance.patient.email],
                fail_silently=True,
            )
        if instance.patient.phone:
            send_mock_sms(instance.patient.phone, f'Appointment booked. Token: {instance.token_number}')
        return instance

    def update(self, instance, validated_data):
        validated_data.pop('patient_id', None)
        validated_data.pop('doctor_user_id', None)
        return super().update(instance, validated_data)


class LabTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTest
        fields = '__all__'


class WardSerializer(serializers.ModelSerializer):
    available_beds = serializers.SerializerMethodField()

    class Meta:
        model = Ward
        fields = ['id', 'name', 'ward_type', 'total_beds', 'available_beds', 'created_at', 'updated_at']

    def get_available_beds(self, obj):
        return obj.beds.filter(is_occupied=False).count()


class BedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bed
        fields = '__all__'


class BedTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = BedTransfer
        fields = '__all__'

    def create(self, validated_data):
        from_bed = validated_data.get('from_bed')
        to_bed = validated_data['to_bed']
        patient = validated_data['patient']

        if from_bed:
            from_bed.is_occupied = False
            from_bed.current_patient = None
            from_bed.save(update_fields=['is_occupied', 'current_patient'])

        to_bed.is_occupied = True
        to_bed.current_patient = patient
        to_bed.save(update_fields=['is_occupied', 'current_patient'])

        return super().create(validated_data)

