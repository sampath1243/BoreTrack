from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

def noop(apps, schema_editor): pass

class Migration(migrations.Migration):
    dependencies = [('core','0005_wagesettlement')]
    operations = [
        migrations.CreateModel(
            name='JobFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)), ('updated_at', models.DateTimeField(auto_now=True)),
                ('file', models.FileField(upload_to='boretrack/jobs/%Y/%m/')),
                ('file_type', models.CharField(choices=[('document','Document'),('receipt','Receipt'),('photo','Job Photo'),('other','Other')], default='document', max_length=20)),
                ('caption', models.CharField(blank=True, max_length=255)),
                ('latitude', models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ('job', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='files', to='core.job')),
                ('uploaded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='boretrack_job_files', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='JobLocation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)), ('updated_at', models.DateTimeField(auto_now=True)),
                ('latitude', models.DecimalField(decimal_places=7, max_digits=10)),
                ('longitude', models.DecimalField(decimal_places=7, max_digits=10)),
                ('accuracy_m', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('captured_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('note', models.CharField(blank=True, max_length=255)),
                ('captured_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='boretrack_locations', to=settings.AUTH_USER_MODEL)),
                ('job', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='locations', to='core.job')),
            ],
        ),
    ]
