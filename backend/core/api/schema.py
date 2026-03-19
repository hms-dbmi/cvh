from typing import Annotated, Any, Literal, TypedDict

from ninja import ModelSchema, Schema
from pydantic import UUID4, EmailStr, Field

from .models import Dataset, Project, ProjectMember, Tag, VisualizationConf


class DatasetQuerySchema(Schema):
    tags: list[str] = Field(None, alias="tags")
    assembly: list[str] = Field(None, alias="assembly")
    file_type: list[str] = Field(None, alias="file_type")
    name: str = Field(None, alias="name")


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
    assembly: Literal[
        "hg38", "hg19", "hg18", "hg17", "hg16", "mm10", "mm9", "unknown"
    ]

    class Meta:
        model = Dataset
        fields = ["name", "description", "source_url", "data_type"]


class GoslingDatasetSimple(GoslingDataCommon):
    file_type: Literal["bigwig", "vector", "cooler"]


class GoslingDesignerMultiVec(GoslingDataCommon):
    file_type: Literal["multivec"]
    row_names: list[str]


class GoslingDesignerBam(GoslingDataCommon):
    file_type: Literal["bam"]
    index_url: str


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
    GoslingDataCommon, GoslingDesignerDataColumn
):
    file_type: Literal["vcf", "bed", "gff"]
    index_url: str


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


GoslingDesignerModel = Annotated[
    GoslingDatasetSimple
    | GoslingDesignerBam
    | GoslingDesignerMultiVec
    | GoslingDesignerIndex
    | GoslingDesignerBEDB
    | GoslingDesignerCSV,
    Field(discriminator="file_type"),
]


class DatasetIn(Schema):
    workspace_uuid: UUID4 | None = None
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
            "data_type",
            "assembly",
            "data_column",
            "row_names",
            "headers",
            "index_url",
            "separator",
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
