from ninja import Schema
#from pydantic import UUID4
#from typing import Optional


class ProjectIn(Schema):
    name: str
    description: str
    private: bool
    # group_uuid: Optional[UUID4]
