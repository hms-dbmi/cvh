"""One ProjectMember row per user per workspace.

Adding a member who was already one created a second row, and every later
`.get()` of that membership then failed with MultipleObjectsReturned. Collapse
any existing duplicates before adding the constraint: keep the row with the
highest permission level (the lowest id among equals) and delete the rest.
"""

from django.conf import settings
from django.db import migrations, models


def remove_duplicate_members(apps, schema_editor):
    ProjectMember = apps.get_model("api", "ProjectMember")
    duplicates = (
        ProjectMember.objects.values("project_key", "user_key")
        .annotate(rows=models.Count("id"))
        .filter(rows__gt=1)
    )
    for pair in duplicates:
        rows = ProjectMember.objects.filter(
            project_key=pair["project_key"], user_key=pair["user_key"]
        ).order_by("-permissions", "id")
        keep = rows.first()
        rows.exclude(pk=keep.pk).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0033_rename_vitessce_file_types"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(remove_duplicate_members, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="projectmember",
            constraint=models.UniqueConstraint(
                fields=("project_key", "user_key"), name="unique_project_member"
            ),
        ),
    ]
