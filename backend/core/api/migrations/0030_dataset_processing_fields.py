from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0029_alter_visualizationconf_options"),
    ]

    operations = [
        migrations.AddField(
            model_name="dataset",
            name="cfdb_dcc",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name="dataset",
            name="cfdb_id",
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name="dataset",
            name="processing_status",
            field=models.CharField(
                choices=[
                    ("not_needed", "Not needed"),
                    ("needed", "Needed"),
                    ("started", "Started"),
                    ("processed", "Processed"),
                    ("failed", "Failed"),
                ],
                default="not_needed",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="dataset",
            name="processing_job_id",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="dataset",
            name="processing_started_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="dataset",
            name="processing_completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="dataset",
            name="processing_error",
            field=models.TextField(blank=True, null=True),
        ),
    ]
