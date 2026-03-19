from django.contrib.auth.models import User
from django.db.models import Q
from django.http import Http404

from .models import Project, Tag


def get_or_create_tags(tags_data, project=None):
    """Get or create tags from a list of dicts with 'tag' and 'key' keys."""
    tags = []
    for t in tags_data:
        tag, _ = Tag.objects.get_or_create(
            tag=t["tag"], key=t["key"], project_key=project
        )
        tags.append(tag)
    return tags


def apply_partial_update(instance, data, exclude_fields=None):
    """Apply a dict of field values to a model instance and save."""
    if exclude_fields is None:
        exclude_fields = set()
    for attr, value in data.items():
        if attr not in exclude_fields:
            setattr(instance, attr, value)
    instance.save()


def get_model_tags_in_workspace(model_class, project):
    """Return distinct tags used by a model in a workspace."""
    field_values = (
        model_class.objects.filter(Q(project_key=project))
        .values("tags__tag", "tags__uuid", "tags__key")
        .distinct()
        .exclude(tags__uuid=None)
    )

    return [
        dict(
            tag=item["tags__tag"],
            key=item["tags__key"],
            uuid=item["tags__uuid"],
        )
        for item in field_values
    ]


def _get_workspace(workspace_uuid: str, user: User, error_message: str):
    try:
        project = Project.objects.get(uuid=workspace_uuid, private=False)
    except Project.DoesNotExist:
        try:
            project = Project.objects.get_read_project(
                user=user, project_uuid=workspace_uuid
            )
        except Project.DoesNotExist:
            raise Http404(error_message) from None
    return project
