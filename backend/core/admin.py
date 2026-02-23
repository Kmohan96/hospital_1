from django.contrib import admin

from .models import Appointment, Bed, BedTransfer, Doctor, DoctorLeave, DoctorSchedule, LabTest, Patient, User, Ward

admin.site.register(User)
admin.site.register(Patient)
admin.site.register(Doctor)
admin.site.register(DoctorSchedule)
admin.site.register(DoctorLeave)
admin.site.register(Appointment)
admin.site.register(LabTest)
admin.site.register(Ward)
admin.site.register(Bed)
admin.site.register(BedTransfer)
