from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('recruitmentAPI', 'previous_migration_name'),  # Replace with your last migration
    ]

    operations = [
        migrations.CreateModel(
            name='ConnectionRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('ACCEPTED', 'Accepted'), ('REJECTED', 'Rejected'), ('IGNORED', 'Ignored')], default='PENDING', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('receiver', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_requests', to='recruitmentAPI.user')),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_requests', to='recruitmentAPI.user')),
            ],
            options={
                'unique_together': {('sender', 'receiver')},
            },
        ),
    ] 