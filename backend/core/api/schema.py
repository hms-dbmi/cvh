from ninja import Schema, ModelSchema
from pydantic import UUID4
from typing import Optional

from .models import Project, Dataset, VisualizationConf

shared_output_fields = ['uuid', 'name', 'description', 'created_timestamp', 'modified_timestamp', 'last_viewed_timestamp']
                 
class ProjectIn(Schema):
    name: str
    description: str
    private: bool
    # group_uuid: Optional[UUID4]

class ProjectOut(ModelSchema):
    class Meta:
        model = Project
        fields = ['private', *shared_output_fields]

class DatasetIn(ModelSchema):
    project_uuid: Optional[UUID4] = None
    class Meta:
        model = Dataset
        fields = ['name', 'description', 'source_url', 'file_type', 'data_type']


class DatasetOut(ModelSchema):
    class Meta:
        model = Dataset
        fields = ['source_url', 'file_type', 'data_type', *shared_output_fields]

class VisualizationIn(ModelSchema):
    project_uuid: UUID4
    class Meta:
        model = VisualizationConf
        fields = ['name', 'description', 'conf', 'tool', 'tool_version']

class VisualizationNoConfOut(ModelSchema):
    class Meta:
        model = VisualizationConf
        fields = ['tool', 'tool_version', *shared_output_fields]
class VisualizationOut(ModelSchema):
    class Meta:
        model = VisualizationConf
        fields = ['conf', 'tool', 'tool_version', *shared_output_fields]

