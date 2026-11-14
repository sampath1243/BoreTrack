from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("core", "0004_fuellog_machineoperation_breakdown")]
    operations = [migrations.CreateModel(
        name="WageSettlement",
        fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("period_start", models.DateField()),
            ("period_end", models.DateField()),
            ("payable_days", models.DecimalField(decimal_places=2, default=0, max_digits=7)),
            ("base_wage", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            ("overtime_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            ("gross_wage", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            ("advance_deduction", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            ("other_deduction", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            ("net_payable", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            ("paid_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            ("status", models.CharField(choices=[("draft","Draft"),("approved","Approved"),("paid","Paid"),("partial","Partially Paid")], default="draft", max_length=20)),
            ("paid_date", models.DateField(blank=True, null=True)),
            ("note", models.TextField(blank=True)),
            ("worker", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="wage_settlements", to="core.worker")),
        ],
    )]
