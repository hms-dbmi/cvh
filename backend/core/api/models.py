import uuid

from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Count, Q


class UserCreated(models.Model):
    """Abstract base for user-facing records with a name, UUID, and timestamps.

    `help_text` here flows through to Django Ninja `ModelSchema` and
    surfaces in the OpenAPI docs (Swagger UI), the generated frontend
    types, and the Django admin.
    """

    name = models.CharField(
        max_length=100,
        help_text="Human-readable name shown in the UI.",
    )
    uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier used in URLs and cross-references.",
    )
    description = models.TextField(
        max_length=300,
        null=True,
        help_text="Free-text description shown alongside the record.",
    )
    created_timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="When the record was first created.",
    )
    modified_timestamp = models.DateTimeField(
        auto_now=True,
        help_text="When any field last changed.",
    )
    last_viewed_timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="When the authenticated user last opened this record.",
    )

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
            # `select_related("user_key")` prefetches the creator so the
            # `created_by` field on WorkspaceOut can serialize without
            # firing an N+1 query per workspace in the paged list.
            .select_related("user_key")
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
    """A collaborative workspace containing datasets and visualizations.

    Called a "workspace" in the UI. Access is governed by ProjectMember
    rows plus the `private` flag — public projects are readable by
    anyone, private ones only by explicit members.
    """

    private = models.BooleanField(
        default=True,
        help_text=(
            "If True, only workspace members can access the project."
            " If False, listed on the public workspaces endpoint and"
            " readable by anyone."
        ),
    )
    group_key = models.ForeignKey(
        Group, on_delete=models.CASCADE, blank=True, null=True
    )
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    objects = ProjectsManager()


class Tag(models.Model):
    """A workspace-scoped tag attachable to datasets and visualizations.

    Tags can optionally be grouped by `key` (e.g. `key="assay",
    tag="ChIP-seq"`) to give the UI structured filtering.
    """

    tag = models.CharField(
        max_length=50,
        help_text="The tag's label value.",
    )
    key = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Optional namespace/category the tag belongs to (e.g. 'assay').",
    )
    uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        help_text="Unique tag identifier.",
    )
    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )

    def __str__(self):
        return f"{self.key}: {self.tag}"


class Dataset(UserCreated):
    """A data source referenced by one or more visualizations.

    CVH doesn't host the data bytes — `source_url` points at where the
    visualization tool actually fetches them (S3, cfdb, HTTP host,
    etc.). Datasets belong to exactly one workspace via `project_key`.
    """

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

    tool = models.CharField(max_length=10, choices=Tool, default=Tool.gosling)
    source_url = models.URLField(
        max_length=1000,
        help_text="URL from which the visualization tool fetches data bytes.",
    )
    file_type = models.CharField(
        max_length=50,
        help_text=(
            "Data format. Recognized values: bigwig, cooler, vector,"
            " bam, vcf, bed, gff, csv, multivec, beddb."
        ),
    )
    data_type = models.CharField(
        max_length=50,
        help_text=(
            "Free-form data-type label displayed alongside file_type"
            " (e.g. 'signal', 'annotation'). Frequently empty."
        ),
    )
    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    tags = models.ManyToManyField(Tag)
    assembly = models.CharField(
        max_length=50,
        null=True,
        help_text=(
            "Genome assembly the data is aligned to — e.g. hg38, mm10,"
            " dm6, T2T-CHM13. Null for coordinate-free formats."
        ),
    )
    index_url = models.CharField(
        max_length=1000,
        null=True,
        help_text=(
            "For indexed formats (BAM, VCF, BED, GFF): URL of the"
            " sidecar index file (.bai, .tbi, etc.)."
        ),
    )
    separator = models.CharField(
        max_length=50,
        null=True,
        help_text="For CSV: field separator character (e.g. ',' or '\\t').",
    )
    headers = models.BooleanField(
        default=False,
        help_text="For CSV: whether the file has a header row.",
    )
    data_column = models.JSONField(
        null=True,
        blank=True,
        help_text=(
            "For tabular formats (CSV, BED, VCF, GFF): mapping of column"
            " names to their semantic type (nominal, quantitative,"
            " chromosome, genomic, key)."
        ),
    )
    row_names = ArrayField(
        models.CharField(max_length=500),
        null=True,
        blank=True,
        help_text="For multivec: names of the rows (samples/tracks).",
    )

    # cfdb-backed datasets. Populated for processable file types; null for
    # raw-URL uploads (existing bigwig/cooler/csv/etc. flows). `source_url`
    # is derived from these at create time as
    # `{settings.CFDB_BASE_URL}/data/{cfdb_dcc}/{cfdb_id}`.
    cfdb_dcc = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text=(
            "cfdb Data Coordination Center slug (e.g. '4dn', 'encode')."
            " Non-null for datasets added via the Browse Library flow."
        ),
    )
    cfdb_id = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text=(
            "cfdb-side identifier for the file. Paired with cfdb_dcc;"
            " source_url is derived from these at create time."
        ),
    )

    # Processing state. Set automatically from `file_type` on first save.
    # See `api.format_eligibility.PROCESSABLE_FORMATS` for which file types
    # require processing.
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus,
        default=ProcessingStatus.NOT_NEEDED,
        help_text=(
            "State machine for cfdb-backed datasets that need server-side"
            " processing (BAM/VCF/BED/GFF). Terminal states: PROCESSED"
            " (ready to render), FAILED (see processing_error)."
        ),
    )
    processing_job_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="cfdb job identifier while processing is in flight.",
    )
    processing_started_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When cfdb processing began.",
    )
    processing_completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When cfdb processing reached a terminal state.",
    )
    processing_error = models.TextField(
        null=True,
        blank=True,
        help_text="Error message from cfdb if processing_status is FAILED.",
    )

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
    """A saved Gosling spec or Vitessce config displayable inside a workspace.

    Model name kept as `VisualizationConf` for historical reasons —
    the UI and API surface just say "visualization."
    """

    class Tool(models.TextChoices):
        gosling = "gosling"
        vitessce = "vitessce"

    conf = models.JSONField(
        null=True,
        help_text=(
            "Gosling spec (for tool='gosling') or Vitessce config"
            " (for tool='vitessce'). Structure depends on the tool"
            " — consult the respective docs for the schema."
        ),
    )
    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )
    author = models.CharField(
        max_length=100,
        null=True,
        help_text="Attribution string shown alongside the visualization in the UI.",
    )
    tool = models.CharField(
        max_length=10,
        choices=Tool,
        default=Tool.gosling,
        help_text="Rendering tool: 'gosling' or 'vitessce'.",
    )
    tags = models.ManyToManyField(Tag)
    published = models.BooleanField(
        default=False,
        help_text=(
            "If True, visible on the public visualizations endpoint and"
            " embeddable without authentication."
        ),
    )
    n_tracks = models.IntegerField(
        default=0,
        null=True,
        help_text=(
            "Number of tracks in the visualization's config. Cached from"
            " the config on save so list responses don't need to parse"
            " the full spec."
        ),
    )
    n_datasets = models.IntegerField(
        default=0,
        null=True,
        help_text="Number of distinct datasets referenced by the config.",
    )
    published_timestamp = models.DateTimeField(
        null=True,
        help_text="When the visualization was last published. Null if never.",
    )

    class Meta:
        verbose_name = "Visualization"
        verbose_name_plural = "Visualizations"


class ProjectMember(models.Model):
    """Membership record connecting a User to a Project with a permission level."""

    class Permissions(models.IntegerChoices):
        read = 1, "read"
        write = 2, "write"
        admin = 3, "admin"

    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    permissions = models.IntegerField(
        choices=Permissions,
        default=1,
        help_text=(
            "Access level: 1=read (view only), 2=write (add and edit data"
            " and visualizations), 3=admin (also manage members and"
            " workspace settings)."
        ),
    )
