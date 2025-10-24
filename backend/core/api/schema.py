from ninja import Schema, ModelSchema
from pydantic import UUID4, EmailStr, Field
from typing import Optional, Any, List, Literal, Union, Annotated
from typing_extensions import Dict, TypedDict

from .models import Project, Dataset, VisualizationConf, ProjectMember, Tag


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


class ProjectIn(Schema):
    name: str
    description: str
    private: bool
    # group_uuid: Optional[UUID4]


class PartialProjectIn(ProjectIn, OptionalSchema):
    pass


class ProjectOut(ModelSchema):
    datasets_count: int
    visualizations_count: int
    permissions: Optional[int] = None

    class Meta:
        model = Project
        fields = ["private", *shared_output_fields]


class ProjectOutWithMembersCount(ProjectOut):
    project_members_count: int


class GoslingDataCommon(ModelSchema):
    assembly: Literal["hg38", "hg19", "hg18", "hg17", "hg16", "mm10", "mm9", "unknown"]

    class Meta:
        model = Dataset
        fields = ["name", "description", "source_url", "data_type"]


class GoslingDatasetSimple(GoslingDataCommon):
    file_type: Literal["bigwig", "vector", "cooler"]


class GoslingDesignerMultiVec(GoslingDataCommon):
    file_type: Literal["multivec"]
    row_names: List[str]


class GoslingDesignerDataColumn(Schema):
    data_column: Optional[
        Dict[str, Literal["nominal", "quantitative", "chromosome", "genomic", "key"]]
    ] = None


class GoslingDesignerIndex(GoslingDataCommon, GoslingDesignerDataColumn):
    file_type: Literal["vcf", "bed", "gff"]
    index_url: str


class GoslingDesignerBEDB(GoslingDataCommon, GoslingDesignerDataColumn):
    file_type: Literal["beddb"]


class GoslingDesignerCSV(GoslingDataCommon):
    file_type: Literal["csv"]
    separator: str
    headers: bool
    data_column: Dict[
        str, Literal["nominal", "quantitative", "chromosome", "genomic", "key"]
    ]


GoslingDesignerModel = Annotated[
    Union[
        GoslingDatasetSimple,
        GoslingDesignerMultiVec,
        GoslingDesignerIndex,
        GoslingDesignerBEDB,
        GoslingDesignerCSV,
    ],
    Field(discriminator="file_type"),
]


class DatasetIn(Schema):
    project_uuid: Optional[UUID4] = None
    dataset: GoslingDesignerModel


class PartialDatasetIn(Schema):
    project_uuid: Optional[UUID4] = None
    dataset: Optional[GoslingDesignerModel] = None


class DatasetUpdate(PartialDatasetIn):
    uuid: UUID4


class DatasetOut(ModelSchema):
    class Meta:
        model = Dataset
        fields = [
            "source_url",
            "file_type",
            "data_type",
            "assembly",
            "data_column",
            "headers",
            "index_url",
            "separator",
            *shared_output_fields,
        ]


class TagIn(TypedDict):
    tag: str
    key: str


class TagsIn(Schema):
    tags: List[TagIn]
    uuid: UUID4
    project_uuid: UUID4


class TagOut(ModelSchema):
    class Meta:
        model = Tag
        fields = ["tag", "key", "uuid"]


class DatasetWithTagsOut(DatasetOut):
    tags: List[TagOut]


class VisualizationIn(ModelSchema):
    project_uuid: UUID4
    description: Optional[str] = None

    class Meta:
        model = VisualizationConf
        fields = ["name"]


class VisualizationNoConfOut(ModelSchema):
    tags: List[TagOut]

    class Meta:
        model = VisualizationConf
        fields = [
            "published",
            "n_tracks",
            "n_datasets",
            "published_timestamp",
            *shared_output_fields,
        ]


class VisualizationOut(ModelSchema):
    tags: List[TagOut]

    class Meta:
        model = VisualizationConf
        fields = [
            "conf",
            "published",
            "n_tracks",
            "n_datasets",
            "published_timestamp",
            *shared_output_fields,
        ]


class PartialVisualizationUpdate(ModelSchema, OptionalSchema):
    class Meta:
        model = VisualizationConf
        fields = ["name", "description", "conf", "published", "n_tracks", "n_datasets"]


class ProjectMemberIn(Schema):
    project_uuid: UUID4
    email: EmailStr


class ProjectMemberUpdate(ModelSchema):
    project_uuid: UUID4
    email: EmailStr

    class Meta:
        model = ProjectMember
        fields = ["permissions"]


class ProjectMemberOut(ModelSchema):
    email: EmailStr

    class Meta:
        model = ProjectMember
        fields = ["permissions"]
