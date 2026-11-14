from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("core", "0002_booking_siteinspection")]
    operations = [
        migrations.CreateModel(name="RateCard", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("name", models.CharField(max_length=160)),
            ("effective_from", models.DateField()),
            ("effective_to", models.DateField(blank=True, null=True)),
            ("season", models.CharField(blank=True, max_length=80)),
            ("active", models.BooleanField(default=True)),
            ("notes", models.TextField(blank=True)),
        ]),
        migrations.CreateModel(name="RateLine", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("charge_type", models.CharField(choices=[("drilling", "Drilling"),("jali", "Jali"),("normal_casing", "Normal Casing"),("freshing", "Freshing"),("bata", "Bata"),("transport", "Transport"),("other", "Other")], max_length=30)),
            ("unit", models.CharField(default="ft", max_length=40)),
            ("rate", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            ("casing_company", models.CharField(blank=True, max_length=100)),
            ("casing_type", models.CharField(blank=True, max_length=100)),
            ("note", models.TextField(blank=True)),
            ("rate_card", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="lines", to="core.ratecard")),
        ]),
    ]
