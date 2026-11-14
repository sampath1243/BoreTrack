from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("core", "0003_ratecard_rateline")]
    operations = [
        migrations.CreateModel(name="FuelLog", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("date", models.DateField()), ("liters", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
            ("price_per_liter", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
            ("hour_meter", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
            ("supplier", models.CharField(blank=True, max_length=160)), ("reference", models.CharField(blank=True, max_length=120)),
            ("notes", models.TextField(blank=True)),
            ("job", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="fuel_logs", to="core.job")),
            ("machine", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="fuel_logs", to="core.machine")),
        ]),
        migrations.CreateModel(name="MachineOperation", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)), ("date", models.DateField()),
            ("start_hour_meter", models.DecimalField(decimal_places=2, default=0, max_digits=10)), ("end_hour_meter", models.DecimalField(decimal_places=2, default=0, max_digits=10)), ("notes", models.TextField(blank=True)),
            ("job", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="machine_operations", to="core.job")),
            ("machine", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="operations", to="core.machine")),
            ("worker", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="machine_operations", to="core.worker")),
        ]),
        migrations.CreateModel(name="Breakdown", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("started_at", models.DateTimeField()), ("resolved_at", models.DateTimeField(blank=True, null=True)),
            ("status", models.CharField(choices=[("open","Open"),("repairing","Repairing"),("resolved","Resolved")], default="open", max_length=20)),
            ("reason", models.CharField(max_length=255)), ("repair_work", models.TextField(blank=True)), ("mechanic", models.CharField(blank=True, max_length=120)),
            ("parts_cost", models.DecimalField(decimal_places=2, default=0, max_digits=12)), ("labour_cost", models.DecimalField(decimal_places=2, default=0, max_digits=12)), ("notes", models.TextField(blank=True)),
            ("job", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="breakdowns", to="core.job")),
            ("machine", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="breakdowns", to="core.machine")),
        ]),
    ]
