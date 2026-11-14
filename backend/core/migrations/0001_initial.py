from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    operations = [
        migrations.CreateModel(
            name='Agent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=120)),
                ('phone', models.CharField(blank=True, max_length=30)),
                ('active', models.BooleanField(default=True)),
                ('notes', models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Machine',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=120)),
                ('code', models.CharField(max_length=40, unique=True)),
                ('status', models.CharField(choices=[('available','Available'),('drilling','Drilling'),('maintenance','Maintenance'),('breakdown','Breakdown')], default='available', max_length=20)),
                ('hour_meter', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('notes', models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Worker',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=120)),
                ('phone', models.CharField(blank=True, max_length=30)),
                ('role', models.CharField(choices=[('driver','Driver'),('driller','Driller'),('helper','Helper'),('mechanic','Mechanic'),('other','Other')], default='helper', max_length=20)),
                ('daily_wage', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('active', models.BooleanField(default=True)),
                ('notes', models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('role', models.CharField(choices=[('owner','Owner'),('manager','Manager'),('office','Office Staff'),('supervisor','Site Supervisor'),('driver','Driver'),('worker','Worker'),('accountant','Accountant')], default='worker', max_length=20)),
                ('phone', models.CharField(blank=True, max_length=30)),
                ('job_title', models.CharField(blank=True, max_length=100)),
                ('active', models.BooleanField(default=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Customer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=160)),
                ('phone', models.CharField(blank=True, max_length=30)),
                ('village', models.CharField(blank=True, max_length=120)),
                ('address', models.TextField(blank=True)),
                ('notes', models.TextField(blank=True)),
                ('agent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='customers', to='core.agent')),
            ],
        ),
        migrations.CreateModel(
            name='Job',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('site', models.CharField(max_length=255)),
                ('status', models.CharField(choices=[('site_check','Site Check'),('booked','Booked'),('active','Active'),('completed','Completed'),('cancelled','Cancelled')], default='site_check', max_length=20)),
                ('agreed_total', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('advance', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('price_note', models.TextField(blank=True)),
                ('notes', models.TextField(blank=True)),
                ('booked_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('agent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='jobs', to='core.agent')),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='jobs', to='core.customer')),
                ('machine', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='jobs', to='core.machine')),
            ],
        ),
        migrations.CreateModel(
            name='Point',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=80)),
                ('result', models.CharField(choices=[('pending','Pending'),('passed','Passed'),('failed','Failed')], default='pending', max_length=20)),
                ('rods', models.PositiveIntegerField(default=0)),
                ('inner_feet', models.DecimalField(decimal_places=2, default=5, max_digits=8)),
                ('bit_feet', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('drilling_rate', models.DecimalField(decimal_places=2, default=70, max_digits=10)),
                ('notes', models.TextField(blank=True)),
                ('job', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='points', to='core.job')),
            ],
        ),
        migrations.CreateModel(
            name='CasingLine',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('company', models.CharField(default='Sudhakar', max_length=100)),
                ('casing_type', models.CharField(default='Normal', max_length=100)),
                ('source', models.CharField(choices=[('business','Business supplied'),('customer','Customer supplied')], default='business', max_length=20)),
                ('quantity_feet', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('rate', models.DecimalField(decimal_places=2, default=350, max_digits=10)),
                ('note', models.TextField(blank=True)),
                ('job', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='casing_lines', to='core.job')),
            ],
        ),
        migrations.CreateModel(
            name='JobCharge',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('charge_type', models.CharField(choices=[('drilling','Drilling'),('jali','Jali'),('normal_casing','Normal Casing'),('freshing','Freshing'),('bata','Bata'),('transport','Transport'),('other','Other')], max_length=30)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('quantity', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('unit', models.CharField(default='ft', max_length=40)),
                ('rate', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('job', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='charges', to='core.job')),
                ('point', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.point')),
            ],
        ),
        migrations.CreateModel(
            name='Attendance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(default=django.utils.timezone.localdate)),
                ('present', models.BooleanField(default=True)),
                ('hours', models.DecimalField(decimal_places=2, default=0, max_digits=6)),
                ('overtime_hours', models.DecimalField(decimal_places=2, default=0, max_digits=6)),
                ('note', models.CharField(blank=True, max_length=255)),
                ('job', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='attendance', to='core.job')),
                ('worker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendance', to='core.worker')),
            ],
        ),
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('method', models.CharField(default='cash', max_length=40)),
                ('received_at', models.DateTimeField(auto_now_add=True)),
                ('reference', models.CharField(blank=True, max_length=120)),
                ('note', models.CharField(blank=True, max_length=255)),
                ('job', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='core.job')),
            ],
        ),
        migrations.CreateModel(
            name='Expense',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('fuel','Fuel / Diesel'),('maintenance','Maintenance'),('wages','Wages'),('transport','Transport'),('other','Other')], max_length=30)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('expense_date', models.DateField(default=django.utils.timezone.localdate)),
                ('job', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='expenses', to='core.job')),
            ],
        ),
        migrations.CreateModel(
            name='Maintenance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('maintenance_type', models.CharField(max_length=100)),
                ('cost', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('started_at', models.DateTimeField()),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('machine', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='maintenance', to='core.machine')),
            ],
        ),
        migrations.CreateModel(
            name='WorkerAdvance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('date', models.DateField(default=django.utils.timezone.localdate)),
                ('note', models.CharField(blank=True, max_length=255)),
                ('worker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='advances', to='core.worker')),
            ],
        ),
    ]
