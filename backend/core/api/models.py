from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.utils.translation import gettext_lazy as _
import uuid

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
    member_projects = ProjectMember.objects.filter(user_key=user, permissions__gte=permission).values("project_key")
    return Q(Q(user_key=user) | Q(pk__in=member_projects))
    
class ProjectPermissionManager(models.Manager):
    def get_project_with_permission(self, user: int, permission: int, project_uuid: str):
        query = get_user_projects_query(user=user, permission=permission)
        return super().get_queryset().get(query & Q(uuid=project_uuid))
    
    def get_projects_with_permission(self, user: int, permission: int):
        query = get_user_projects_query(user=user, permission=permission)
        return super().get_queryset().filter(query)
    
    def get_read_project(self, user: int, project_uuid: str):
        return self.get_project_with_permission(user=user, project_uuid=project_uuid, permission=1)
    
    def get_write_project(self, user: int, project_uuid: str):
        return self.get_project_with_permission(user=user, project_uuid=project_uuid, permission=2)
    
    def get_admin_project(self, user: int, project_uuid: str):
        return self.get_project_with_permission(user=user, project_uuid=project_uuid, permission=3)

    def get_read_projects(self, user: int):
        return self.get_projects_with_permission(user=user, permission=1)
    
    def get_write_projects(self, user: int):
        return self.get_projects_with_permission(user=user, permission=1)
    
    def get_admin_projects(self, user: int):
        return self.get_projects_with_permission(user=user, permission=3)

class Project(UserCreated):
    private = models.BooleanField(default=True)
    group_key = models.ForeignKey(Group, on_delete=models.CASCADE, blank=True, null=True)
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)

    objects = ProjectPermissionManager()

class Dataset(UserCreated):
    source_url = models.URLField(max_length=100)
    file_type = models.CharField(max_length=50)
    data_type = models.CharField(max_length=50)
    project_key = models.ForeignKey(Project, on_delete=models.CASCADE, blank=True, null=True)
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)

class VisualizationConf(UserCreated):
    conf = models.JSONField()
    tool = models.CharField(max_length=50)
    tool_version = models.CharField(max_length=50, blank=True)
    project_key = models.ForeignKey(Project, on_delete=models.CASCADE, blank=True, null=True)

class ProjectMember(models.Model):
    class Permissions(models.IntegerChoices):
        read = 1, "read"
        write = 2, "write"
        admin = 3, "admin"
        owner = 4, "owner"

    project_key = models.ForeignKey(Project, on_delete=models.CASCADE, blank=True, null=True)
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    permissions = models.IntegerField(choices=Permissions, default=1)
