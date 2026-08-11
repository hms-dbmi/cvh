from datetime import datetime
from typing import Annotated, Any, Literal, TypedDict

from ninja import ModelSchema, Schema
from pydantic import UUID4, EmailStr, Field, model_validator

from .models import Dataset, Project, ProjectMember, Tag, VisualizationConf


class DatasetQuerySchema(Schema):
    tags: list[str] = Field(None, alias="tags")
    assembly: list[str] = Field(None, alias="assembly")
    file_type: list[str] = Field(None, alias="file_type")
    name: str = Field(None, alias="name")
    tool: Literal["gosling", "vitessce"] | None = Field(None, alias="tool")


class VisualizationQuerySchema(Schema):
    tags: list[str] = Field(None, alias="tags")
    name: str = Field(None, alias="name")
    uuids: list[UUID4] = Field(None, alias="uuids")


class OptionalSchema(Schema):
    @classmethod
    def __pydantic_init_subclass__(cls, **kwargs: Any) -> None:
        super().__pydantic_init_subclass__(**kwargs)

        for field in cls.model_fields.values():
            field.default = None

        cls.model_rebuild(force=True)


shared_output_fields = [
    "uuid",
    "name",
    "description",
    "created_timestamp",
    "modified_timestamp",
    "last_viewed_timestamp",
]


class UserOut(Schema):
    username: str
    first_name: str
    last_name: str
    email: EmailStr


class UserIn(OptionalSchema):
    first_name: str
    last_name: str


class WorkspaceIn(Schema):
    name: str
    description: str
    private: bool


class WorkspaceUpdate(ModelSchema, OptionalSchema):
    class Meta:
        model = Project
        fields = ["name", "description", "private"]


class WorkspaceOut(ModelSchema):
    datasets_count: int
    visualizations_count: int
    permissions: int | None = None

    class Meta:
        model = Project
        fields = ["private", *shared_output_fields]


class WorkspaceOutWithMembersCount(WorkspaceOut):
    workspace_members_count: int


class GoslingDataCommon(ModelSchema):
    # cfdb emits assembly values Gosling doesn't recognize directly
    # (GRCh38, GRCm38, dm6, ce11, T2T-CHM13, …). Store them raw so we
    # don't lose information; the frontend's `toGoslingAssembly` helper
    # translates at the rendering seam (alias or inline ChromSizes).
    assembly: str = Field(max_length=50)

    class Meta:
        model = Dataset
        fields = ["name", "description", "source_url", "data_type"]


class GoslingDatasetSimple(GoslingDataCommon):
    file_type: Literal["bigwig", "vector", "cooler"]


class GoslingDesignerMultiVec(GoslingDataCommon):
    file_type: Literal["multivec"]
    row_names: list[str]


class CfdbSourced(Schema):
    """Mixin for variants that can be sourced from cfdb (Browse Library)
    instead of a user-pasted URL+index. When `cfdb_dcc` + `cfdb_id` are
    set, the backend derives `source_url` and `index_url` is omitted —
    cfdb generates the index server-side. Validated via the model_validator
    on each consumer; cannot live on the mixin because it must run after
    the consumer's `file_type` resolves.
    """

    cfdb_dcc: str | None = None
    cfdb_id: str | None = None


def _validate_url_or_cfdb_source(values: Any) -> Any:
    """Validator for variants that accept either user-pasted
    source_url + index_url OR a cfdb {dcc}/{id} pair. Exactly one path
    must be present — both cfdb identifiers must be set together; an
    incomplete pair counts as the user-URL path.
    """
    has_user_urls = bool(getattr(values, "source_url", None)) and bool(
        getattr(values, "index_url", None)
    )
    has_cfdb = bool(
        getattr(values, "cfdb_dcc", None)
        and getattr(values, "cfdb_id", None)
    )
    if has_user_urls == has_cfdb:
        raise ValueError(
            "Provide either source_url + index_url OR both cfdb_dcc and"
            " cfdb_id, not both."
        )
    return values


class GoslingDesignerBam(GoslingDataCommon, CfdbSourced):
    file_type: Literal["bam"]
    # Optional at the schema layer — the cfdb path derives source_url
    # server-side. Validated by `_check_source` below.
    source_url: str | None = None
    index_url: str | None = None

    @model_validator(mode="after")
    def _check_source(self):
        return _validate_url_or_cfdb_source(self)


class GoslingDesignerDataColumn(Schema):
    data_column: (
        list[
            tuple[
                str,
                Literal[
                    "nominal",
                    "quantitative",
                    "chromosome",
                    "genomic",
                    "key",
                ],
            ]
        ]
        | None
    ) = None


class GoslingDesignerIndex(
    GoslingDataCommon, GoslingDesignerDataColumn, CfdbSourced
):
    file_type: Literal["vcf", "bed", "gff"]
    # Optional at the schema layer — the cfdb path derives source_url
    # server-side. Validated by `_check_source` below.
    source_url: str | None = None
    index_url: str | None = None

    @model_validator(mode="after")
    def _check_source(self):
        return _validate_url_or_cfdb_source(self)


class GoslingDesignerBEDB(
    GoslingDataCommon, GoslingDesignerDataColumn
):
    file_type: Literal["beddb"]


class GoslingDesignerCSV(GoslingDataCommon):
    file_type: Literal["csv"]
    separator: str
    headers: bool
    data_column: list[
        tuple[
            str,
            Literal[
                "nominal",
                "quantitative",
                "chromosome",
                "genomic",
                "key",
            ],
        ]
    ]


class VitessceDataset(ModelSchema):
    """Vitessce-native dataset variants. Vitessce configs reference these
    URLs directly; unlike the Gosling variants there's no assembly, index
    sidecar, or column typing to capture — the config itself carries all
    the projection/coordination metadata Vitessce needs.
    """

    # https://vitessce.io/docs/data-types-file-types/ — strings match
    # vitessce's own `FileType` constants (see @vitessce/constants-internal).
    # Names are case-sensitive; the `image.` prefix on OME variants and
    # the `.zip` / `.h5ad` suffixes are load-bearing on the vitessce side.
    # The list mirrors the frontend's `VITESSCE_FILE_TYPES` and covers
    # both the "joint" Zarr stores (which carry many data types) and the
    # per-data-type atomic files a user picks after choosing a Data Type
    # in the wizard.
    file_type: Literal[
        # Joint stores
        "anndata.zarr",
        "anndata.zarr.zip",
        "anndata.h5ad",
        "spatialdata.zarr",
        "spatialdata.zarr.zip",
        # Image
        "image.ome-tiff",
        "image.ome-zarr",
        "image.ome-zarr.zip",
        # Atomic CSV / JSON
        "obsEmbedding.csv",
        "obsFeatureMatrix.csv",
        "obsSets.csv",
        "obsSets.json",
        "obsSpots.csv",
        "obsPoints.csv",
        "obsLocations.csv",
        "obsLabels.csv",
        "featureLabels.csv",
        "sampleSets.csv",
        # Segmentations
        "obsSegmentations.json",
        "obsSegmentations.ome-zarr",
        "obsSegmentations.ome-zarr.zip",
    ]
    # Optional: the Add Dataset wizard requires a value (paired with
    # `file_type` via the two-dropdown UI), but other create paths —
    # notably a future cfdb → Vitessce importer — only know the file
    # format at import time. Persisted as empty string when absent; the
    # user can pick a value later in the Edit dialog. Kept as a Literal
    # so any non-empty value is one vitessce.js recognizes.
    data_type: (
        Literal[
            "image",
            "obsFeatureMatrix",
            "obsEmbedding",
            "obsSets",
            "obsLocations",
            "obsSpots",
            "obsPoints",
            "obsSegmentations",
            "obsLabels",
            "featureLabels",
            "sampleSets",
        ]
        | None
    ) = None

    class Meta:
        model = Dataset
        # `data_type` is declared as a Literal on the class body above —
        # if we included it in `fields` here, Ninja would pull the model's
        # free-form CharField definition and shadow the Literal.
        fields = ["name", "description", "source_url"]


# Union of all dataset variants the create endpoint accepts. Named
# `GoslingDesignerModel` for historical reasons — kept for API stability
# now that Vitessce shares the same union.
GoslingDesignerModel = Annotated[
    GoslingDatasetSimple
    | GoslingDesignerBam
    | GoslingDesignerMultiVec
    | GoslingDesignerIndex
    | GoslingDesignerBEDB
    | GoslingDesignerCSV
    | VitessceDataset,
    Field(discriminator="file_type"),
]


class DatasetIn(Schema):
    workspace_uuid: UUID4 | None = None
    # Which viewer this dataset was uploaded for. Governs which
    # workspace's data panel surfaces it. Defaults to Gosling so
    # existing callers keep working unchanged.
    tool: Literal["gosling", "vitessce"] = "gosling"
    dataset: GoslingDesignerModel


class ExampleDatasetIn(Schema):
    workspace_uuid: UUID4
    include_visualizations: bool
    example_id: Literal[1, 2]


class DatasetUpdate(ModelSchema, OptionalSchema):
    class Meta:
        model = Dataset
        fields = [
            "name",
            "description",
            "source_url",
            "file_type",
            "tool",
            "data_type",
            "assembly",
            "data_column",
            "row_names",
            "headers",
            "index_url",
            "separator",
        ]


class DatasetOut(ModelSchema):
    class Meta:
        model = Dataset
        fields = [
            "source_url",
            "file_type",
            "tool",
            "data_type",
            "assembly",
            "data_column",
            "row_names",
            "headers",
            "index_url",
            "separator",
            "cfdb_dcc",
            "cfdb_id",
            "processing_status",
            "processing_job_id",
            "processing_started_at",
            "processing_completed_at",
            "processing_error",
            *shared_output_fields,
        ]


class TagIn(TypedDict):
    tag: str
    key: str


class TagsIn(Schema):
    tags: list[TagIn]


class TagOut(ModelSchema):
    class Meta:
        model = Tag
        fields = ["tag", "key", "uuid"]


class DatasetWithTagsOut(DatasetOut):
    tags: list[TagOut]


class VisualizationIn(ModelSchema):
    workspace_uuid: UUID4
    description: str | None = None
    author: str | None = None

    class Meta:
        model = VisualizationConf
        fields = ["name", "tool"]


class VisualizationSummaryOut(ModelSchema):
    tags: list[TagOut]

    class Meta:
        model = VisualizationConf
        fields = [
            "author",
            "tool",
            "published",
            "n_tracks",
            "n_datasets",
            "published_timestamp",
            *shared_output_fields,
        ]


class VisualizationOut(ModelSchema):
    tags: list[TagOut]

    class Meta:
        model = VisualizationConf
        fields = [
            "conf",
            "author",
            "tool",
            "published",
            "n_tracks",
            "n_datasets",
            "published_timestamp",
            *shared_output_fields,
        ]


class VisualizationUpdate(ModelSchema, OptionalSchema):
    class Meta:
        model = VisualizationConf
        fields = [
            "name",
            "description",
            "author",
            "tool",
            "conf",
            "published",
            "n_tracks",
            "n_datasets",
        ]


class WorkspaceMemberIn(Schema):
    email: EmailStr


class WorkspaceMemberUpdate(ModelSchema):
    email: EmailStr

    class Meta:
        model = ProjectMember
        fields = ["permissions"]


class WorkspaceMemberOut(ModelSchema):
    email: EmailStr
    username: str
    first_name: str | None = None
    last_name: str | None = None

    class Meta:
        model = ProjectMember
        fields = ["permissions"]


class SuccessOut(Schema):
    success: bool


class ProcessingStatusUpdate(Schema):
    """Client-reported terminal state for a processing job. The frontend
    polls cfdb's `/jobs/{id}` directly and PUTs the result here so that
    CVH persists the outcome across browser sessions. Only terminal
    statuses are accepted; transient `started` is set by the dispatch
    endpoint and shouldn't be reported back.
    """

    status: Literal["processed", "failed"]
    error: str | None = None


class ProcessingOut(Schema):
    """Snapshot of a dataset's processing state. Returned by the dispatch
    and status-update endpoints so the frontend can update its view
    without a separate read.
    """

    processing_status: str
    processing_job_id: str | None = None
    processing_started_at: datetime | None = None
    processing_completed_at: datetime | None = None
    processing_error: str | None = None
