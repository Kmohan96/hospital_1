from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                UPDATE core_appointment a
                JOIN core_doctor d ON a.doctor_id = d.id
                SET a.doctor_id = d.user_id
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterField(
            model_name="appointment",
            name="doctor",
            field=models.ForeignKey(
                limit_choices_to={"role": "doctor"},
                on_delete=django.db.models.deletion.CASCADE,
                related_name="doctor_appointments",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
