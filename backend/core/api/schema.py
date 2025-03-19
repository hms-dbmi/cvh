from ninja import Schema, ModelSchema
from pydantic import UUID4, EmailStr
from typing import Optional, Any, List

from .models import Project, Dataset, VisualizationConf, ProjectMember, Tag

class OptionalSchema(Schema):
    @classmethod
    def __pydantic_init_subclass__(cls, **kwargs: Any) -> None:
        super().__pydantic_init_subclass__(**kwargs)

        for field in cls.model_fields.values():
            field.default = None

        cls.model_rebuild(force=True)

shared_output_fields = ['uuid', 'name', 'description', 'created_timestamp', 'modified_timestamp', 'last_viewed_timestamp']
                 
class ProjectIn(Schema):
    name: str
    description: str
    private: bool
    # group_uuid: Optional[UUID4]

class ProjectOut(ModelSchema):
    datasets_count: int
    visualizations_count: int
    permissions: Optional[int] = None
    class Meta:
        model = Project
        fields = ['private', *shared_output_fields]

class DatasetIn(ModelSchema):
    project_uuid: Optional[UUID4] = None
    class Meta:
        model = Dataset
        fields = ['name', 'description', 'source_url', 'file_type', 'data_type']

class PartialDatasetIn(ModelSchema, OptionalSchema):
    class Meta:
        model = Dataset
        fields = ['name', 'description', 'source_url', 'file_type', 'data_type']

class DatasetUpdate(PartialDatasetIn):
    project_uuid: Optional[UUID4] = None
    uuid: UUID4

class DatasetOut(ModelSchema):
    combined_tags: List[str]
    class Meta:
        model = Dataset
        fields = ['source_url', 'file_type', 'data_type', *shared_output_fields]

class TagIn(Schema):
    tag: str
    key: Optional[str] = None
    uuid: UUID4
    project_uuid: Optional[UUID4] = None

class VizTagIn(Schema):
    tag: str
    key: Optional[str] = None

class TagOut(ModelSchema):
    class Meta:
        model = Tag
        fields = ["tag"]

class VisualizationIn(ModelSchema):
    project_uuid: UUID4
    class Meta:
        model = VisualizationConf
        fields = ['name', 'description', 'conf', 'tool', 'tool_version']

class VisualizationNoConfOut(ModelSchema):
    combined_tags: List[str]
    class Meta:
        model = VisualizationConf
        fields = ['tool', 'tool_version', 'published', *shared_output_fields]
class VisualizationOut(ModelSchema):
    combined_tags: List[str]
    class Meta:
        model = VisualizationConf
        fields = ['conf', 'tool', 'tool_version', 'published', *shared_output_fields]

class PartialVisualizationUpdate(ModelSchema, OptionalSchema):
    class Meta:
        model = VisualizationConf
        fields = ['name', 'description', 'conf', 'tool', 'tool_version', 'published']
class ProjectMemberIn(Schema):
    project_uuid: UUID4
    email: EmailStr

class ProjectMemberOut(ModelSchema):
    email: EmailStr
    class Meta:
        model = ProjectMember
        fields = ["permissions"]
