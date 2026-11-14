from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="Booking",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("source", models.CharField(choices=[("agent","Agent"),("direct","Direct"),("other","Other")], default="agent", max_length=20)),
                ("requested_site", models.CharField(max_length=255)),
                ("requested_date", models.DateField(blank=True, null=True)),
                ("status", models.CharField(choices=[("enquiry","Enquiry"),("site_check","Site Check"),("quoted","Quoted"),("confirmed","Confirmed"),("rejected","Rejected"),("cancelled","Cancelled")], default="enquiry", max_length=20)),
                ("enquiry_note", models.TextField(blank=True)),
                ("agent", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="bookings", to="core.agent")),
                ("customer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="bookings", to="core.customer")),
            ],
            options={},
        ),
        migrations.CreateModel(
            name="SiteInspection",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("inspection_date", models.DateField(default=django.utils.timezone.localdate)),
                ("inspector_name", models.CharField(blank=True, max_length=120)),
                ("road_access", models.CharField(choices=[("good","Good"),("limited","Limited"),("not_accessible","Not accessible")], default="good", max_length=30)),
                ("ground_wet", models.BooleanField(default=False)),
                ("nearby_borewell", models.BooleanField(default=False)),
                ("nearby_distance_m", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("nearby_borewell_owner", models.CharField(blank=True, max_length=160)),
                ("machine_can_reach", models.BooleanField(default=True)),
                ("site_suitable", models.BooleanField(default=False)),
                ("latitude", models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ("decision", models.CharField(choices=[("pending","Pending"),("suitable","Suitable"),("not_suitable","Not suitable")], default="pending", max_length=20)),
                ("notes", models.TextField(blank=True)),
                ("booking", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="inspection", to="core.booking")),
            ],
            options={},
        ),
    ]
