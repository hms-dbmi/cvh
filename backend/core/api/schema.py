from ninja import Schema, ModelSchema
# from pydantic import UUID4
#from typing import Optional

from .models import Project
class ProjectIn(Schema):
    name: str
    description: str
    private: bool
    # group_uuid: Optional[UUID4]

class ProjectOut(ModelSchema):
    class Meta:
        model = Project
        fields = ['uuid', 'name', 'description', 'private', 'created_timestamp', 'modified_timestamp', 'last_viewed_timestamp']

