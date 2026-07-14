import uuid

from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Count, Q


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
    class Meta:
        verbose_name = "Project Group"
        verbose_name_plural = "Project Groups"


def get_user_projects_query(user, permission):
    member_projects = ProjectMember.objects.filter(
        user_key=user, permissions__gte=permission
    ).values("project_key")
    return Q(Q(user_key=user) | Q(pk__in=member_projects))


class ProjectsManager(models.Manager):
    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .annotate(
                datasets_count=Count("dataset", distinct=True),
            )
            .annotate(
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
        return self.get_projects_with_permission(user=user, permission=2)

    def get_admin_projects(self, user: int):
        return self.get_projects_with_permission(user=user, permission=3)


class Project(UserCreated):
    private = models.BooleanField(default=True)
    group_key = models.ForeignKey(
        Group, on_delete=models.CASCADE, blank=True, null=True
    )
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    objects = ProjectsManager()


class Tag(models.Model):
    tag = models.CharField(max_length=50)
    key = models.CharField(max_length=50, blank=True, null=True)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )

    def __str__(self):
        return f"{self.key}: {self.tag}"


class Dataset(UserCreated):
    class ProcessingStatus(models.TextChoices):
        # File format doesn't need server-side processing (e.g. bigwig, cooler).
        NOT_NEEDED = "not_needed", "Not needed"
        # Processable format but processing hasn't been dispatched yet.
        NEEDED = "needed", "Needed"
        # Dispatch sent to cfdb; job in flight.
        STARTED = "started", "Started"
        # cfdb reports completion; artifacts are cached and ready to serve.
        PROCESSED = "processed", "Processed"
        # cfdb returned an error; user may retry.
        FAILED = "failed", "Failed"

    class Tool(models.TextChoices):
        # Which visualization tool this dataset was uploaded for. Governs
        # which workspace's data panel surfaces it. Same string set as
        # VisualizationConf.Tool — kept in sync manually rather than
        # imported because that model imports this one at module scope.
        gosling = "gosling"
        vitessce = "vitessce"

    source_url = models.URLField(max_length=1000)
    file_type = models.CharField(max_length=50)
    tool = models.CharField(max_length=10, choices=Tool, default=Tool.gosling)
    data_type = models.CharField(max_length=50)
    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    tags = models.ManyToManyField(Tag)
    assembly = models.CharField(max_length=50, null=True)
    index_url = models.CharField(max_length=1000, null=True)
    separator = models.CharField(max_length=50, null=True)
    headers = models.BooleanField(default=False)
    data_column = models.JSONField(null=True, blank=True)
    row_names = ArrayField(models.CharField(max_length=500), null=True, blank=True)

    # cfdb-backed datasets. Populated for processable file types; null for
    # raw-URL uploads (existing bigwig/cooler/csv/etc. flows). `source_url`
    # is derived from these at create time as
    # `{settings.CFDB_BASE_URL}/data/{cfdb_dcc}/{cfdb_id}`.
    cfdb_dcc = models.CharField(max_length=50, null=True, blank=True)
    cfdb_id = models.CharField(max_length=200, null=True, blank=True)

    # Processing state. Set automatically from `file_type` on first save.
    # See `api.format_eligibility.PROCESSABLE_FORMATS` for which file types
    # require processing.
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus,
        default=ProcessingStatus.NOT_NEEDED,
    )
    processing_job_id = models.CharField(max_length=100, null=True, blank=True)
    processing_started_at = models.DateTimeField(null=True, blank=True)
    processing_completed_at = models.DateTimeField(null=True, blank=True)
    processing_error = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Only set the initial status on first save — never on update, so we
        # don't overwrite started/processed/failed states.
        #
        # Processing applies to library-sourced datasets only: a row must
        # carry cfdb_dcc + cfdb_id AND be a processable file type. User-
        # added datasets (raw URL uploads) don't go through cfdb regardless
        # of their file_type.
        if self._state.adding:
            from .format_eligibility import is_processable

            backed_by_cfdb = bool(self.cfdb_dcc and self.cfdb_id)
            self.processing_status = (
                self.ProcessingStatus.NEEDED
                if backed_by_cfdb and is_processable(self.file_type)
                else self.ProcessingStatus.NOT_NEEDED
            )
        super().save(*args, **kwargs)


class VisualizationConf(UserCreated):
    class Tool(models.TextChoices):
        gosling = "gosling"
        vitessce = "vitessce"

    class Meta:
        verbose_name = "Visualization"
        verbose_name_plural = "Visualizations"

    conf = models.JSONField(null=True)
    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )
    author = models.CharField(max_length=100, null=True)
    tool = models.CharField(max_length=10, choices=Tool, default=Tool.gosling)
    tags = models.ManyToManyField(Tag)
    published = models.BooleanField(default=False)
    n_tracks = models.IntegerField(default=0, null=True)
    n_datasets = models.IntegerField(default=0, null=True)
    published_timestamp = models.DateTimeField(null=True)


class ProjectMember(models.Model):
    class Permissions(models.IntegerChoices):
        read = 1, "read"
        write = 2, "write"
        admin = 3, "admin"

    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    permissions = models.IntegerField(choices=Permissions, default=1)
