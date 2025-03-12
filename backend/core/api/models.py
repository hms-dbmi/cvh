from django.db import models
from django.db.models import Q, Value, Case, When, CharField, Count
from django.contrib.auth.models import User
from django.db.models.functions import Concat
from django.contrib.postgres.aggregates import ArrayAgg

from django.utils.translation import gettext_lazy as _
import uuid


class UserCreated(models.Model):
    name = models.CharField(max_length=100)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    description = models.TextField(max_length=300, null=True)
    created_timestamp = models.DateTimeField(auto_now_add=True)
    modified_timestamp = models.DateTimeField(auto_now=True)
    last_viewed_timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class Group(UserCreated):
    pass


def get_user_projects_query(user, permission):
    member_projects = ProjectMember.objects.filter(
        user_key=user, permissions__gte=permission
    ).values("project_key")
    return Q(Q(user_key=user) | Q(pk__in=member_projects))


class ProjectsManager(models.Manager):
    def get_queryset(self):
        return (
            super(ProjectsManager, self)
            .get_queryset()
            .annotate(
                datasets_count=Count("dataset",distinct=True),
            ).annotate(
                visualizations_count=Count("visualizationconf", distinct=True),
            )
        )

    def get_project_with_permission(
        self, user: int, permission: int, project_uuid: str
    ):
        query = get_user_projects_query(user=user, permission=permission)
        return self.get_queryset().get(query & Q(uuid=project_uuid))

    def get_projects_with_permission(self, user: int, permission: int):
        query = get_user_projects_query(user=user, permission=permission)
        return self.get_queryset().filter(query)

    def get_read_project(self, user: int, project_uuid: str):
        return self.get_project_with_permission(
            user=user, project_uuid=project_uuid, permission=1
        )

    def get_write_project(self, user: int, project_uuid: str):
        return self.get_project_with_permission(
            user=user, project_uuid=project_uuid, permission=2
        )

    def get_admin_project(self, user: int, project_uuid: str):
        return self.get_project_with_permission(
            user=user, project_uuid=project_uuid, permission=3
        )

    def get_read_projects(self, user: int):
        return self.get_projects_with_permission(user=user, permission=1)

    def get_write_projects(self, user: int):
        return self.get_projects_with_permission(user=user, permission=1)

    def get_admin_projects(self, user: int):
        return self.get_projects_with_permission(user=user, permission=3)


class Tag(models.Model):
    tag = models.CharField(max_length=50)
    key = models.CharField(max_length=50, blank=True, null=True)


class Project(UserCreated):
    private = models.BooleanField(default=True)
    group_key = models.ForeignKey(
        Group, on_delete=models.CASCADE, blank=True, null=True
    )
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    tags = models.ManyToManyField(Tag)
    objects = ProjectsManager()


class DatasetsManager(models.Manager):
    def get_queryset(self):
        return (
            super(DatasetsManager, self)
            .get_queryset()
            .annotate(
                combined_tag=Case(
                    When(
                        tags__key__isnull=False,
                        then=Concat("tags__key", Value(":"), "tags__tag"),
                    ),
                    default="tags__tag",
                    output_field=CharField(),
                )
            )
            .annotate(
                combined_tags=ArrayAgg(
                    "combined_tag",
                    filter=Q(combined_tag__isnull=False),
                    default=Value([]),
                )
            )
        )


class Dataset(UserCreated):
    source_url = models.URLField(max_length=100)
    file_type = models.CharField(max_length=50)
    data_type = models.CharField(max_length=50)
    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    tags = models.ManyToManyField(Tag)

    objects = DatasetsManager()


class VisualizationConf(UserCreated):
    conf = models.JSONField()
    tool = models.CharField(max_length=50)
    tool_version = models.CharField(max_length=50, blank=True)
    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )
    tags = models.ManyToManyField(Tag)


class ProjectMember(models.Model):
    class Permissions(models.IntegerChoices):
        read = 1, "read"
        write = 2, "write"
        admin = 3, "admin"
        owner = 4, "owner"

    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    permissions = models.IntegerField(choices=Permissions, default=1)
