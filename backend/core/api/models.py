from django.db import models
from django.db.models import Q, Value, Case, When, CharField, Count
from django.contrib.auth.models import User
from django.db.models.functions import Concat
from django.contrib.postgres.aggregates import ArrayAgg

from django.utils.translation import gettext_lazy as _
import uuid

from pydantic import ValidationError


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


class TagsManager(models.Manager):
    def get_queryset(self):
        return (
            super(TagsManager, self)
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

    objects = TagsManager()

class DataTypeSpecificFields(models.Model):
    dataset_key = models.ForeignKey(
        Dataset, on_delete=models.CASCADE, blank=True, null=True
    )
    field_name = models.CharField(max_length=100)

    class Meta:
        abstract = True

# https://gosling-lang.org/docs/data/#csv-no-higlass-server
# GoslingCSVDataset
# Represents the fields necessary for a Gosling visualization to render a CSV file.
class GoslingCSVDataset(DataTypeSpecificFields):
    separator = models.CharField(max_length=5)
    sample_length = models.IntegerField(default=1000)
    longToWideId = models.CharField(max_length=100)
    headerNames = models.JSONField() # list of strings
    genomicFieldsToConvert = models.JSONField() # list of objects, each object follows the format {"chromosomeField":"string","genomicFields":"string[]"} ( )
    genomicFields = models.JSONField() # list of strings
    chromosomePrefix = models.CharField(max_length=50)
    chromosomeField = models.CharField(max_length=50)

# https://gosling-lang.org/docs/data/#gff3-no-higlass-server
# GoslingGFF3Dataset
# Represents the fields necessary for a Gosling visualization to render a GFF3 file.
class GoslingGGF3Dataset(DataTypeSpecificFields):
    index_url = models.URLField(max_length=100)
    sample_length = models.IntegerField(default=1000)
    attributes_to_fields = models.JSONField() # list of objects, each object follows the format {"attribute":"string","defaultValue":"string"}

# https://gosling-lang.org/docs/data/#vcf-no-higlass-server
# GoslingVCFDataset
# Represents the fields necessary for a Gosling visualization to render a VCF file.
class GoslingVCFDataset(DataTypeSpecificFields):
    index_url = models.URLField(max_length=100)
    sample_length = models.IntegerField(default=1000)

# https://gosling-lang.org/docs/data/#json-no-higlass-server
# GoslingJSONDataset
# Represents the fields necessary for a Gosling visualization to render a JSON file.
class GoslingJSONDataset(DataTypeSpecificFields):
    sample_length = models.IntegerField(default=1000)
    genomic_fields_to_convert = models.JSONField() # Experimental Proerty. Each object follows the format {"chromosomeField":"string","genomicFields":"string[]"}
    genomic_fields = models.JSONField() # list of strings
    chromosome_field = models.CharField(max_length=50)

# BigWig aggregation validation - https://gosling-lang.org/docs/data/#bigwig-no-higlass-server
# Allowed aggregations per docs are "mean" and "sum"
def validate_bigwig_aggregation(value):
    allowed_aggregations = ["mean", "sum"]
    if value not in allowed_aggregations:
        raise ValidationError(_("Invalid value,"), f"Invalid aggregation method: {value}. Allowed methods are: {allowed_aggregations}")

# https://gosling-lang.org/docs/data/#bigwig-no-higlass-server
# GoslingBigWigDataset
# Represents the fields necessary for a Gosling visualization to render a BigWig file.
class GoslingBigWigDataset(DataTypeSpecificFields):
    value = models.CharField(max_length=100, default="value")
    start = models.CharField(max_length=100, default="start")
    end = models.CharField(max_length=100, default="end")
    column = models.CharField(max_length=100, default="position")
    binSize = models.IntegerField(default=1) # Binning the genomic interval in tiles (unit size: 256).
    aggregation = models.CharField(max_length=100, default="mean", validators=[validate_bigwig_aggregation]) # Aggregation method for the values in each tile. Options: "mean", "sum"


# https://gosling-lang.org/docs/data/#bam-no-higlass-server
# GoslingBAMDataset
# Represents the fields necessary for a Gosling visualization to render a BAM file.
class GoslingBAMDataset(DataTypeSpecificFields):
    index_url = models.URLField(max_length=100)
    max_insert_size = models.IntegerField(default=5000)
    load_mates = models.BooleanField(default=False)
    junction_min_coverage = models.IntegerField(default=1)
    extract_junction = models.BooleanField(default=False)


# https://gosling-lang.org/docs/data/#bed-no-higlass-server
# GoslingBEDDataset
# Represents the fields necessary for a Gosling visualization to render a BED file.
class GoslingBEDDataset(DataTypeSpecificFields):
    index_url = models.URLField(max_length=100)
    sample_length = models.IntegerField(default=1000)
    custom_fields = models.JSONField() # An array of strings, where each string is the name of a non-standard field in the BED file.

# TODO: Vitessce dataset-specific fields (https://vitessce.io/docs/data-types-file-types/)
# Relevant questions to answer:
# - Since the data sources refer to single URLs, how do we handle datasets with multiple files? 
#       Should we only support single-file datasets as a limitation for the time being?
#       Should we have users add the first file as a "must" and then add the other files in additional fields?

class VisualizationConf(UserCreated):
    conf = models.JSONField()
    tool = models.CharField(max_length=50)
    tool_version = models.CharField(max_length=50, blank=True)
    project_key = models.ForeignKey(
        Project, on_delete=models.CASCADE, blank=True, null=True
    )
    tags = models.ManyToManyField(Tag)
    published = models.BooleanField(default=False)

    objects = TagsManager()

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
