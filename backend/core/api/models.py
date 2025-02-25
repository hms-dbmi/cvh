from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
import uuid

class UserCreated(models.Model):
    name = models.CharField(max_length=100)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    description = models.TextField(max_length=300, null=True)
    created_timestamp = models.TimeField(auto_now_add=True)
    modified_timestamp = models.TimeField(auto_now=True)
    last_viewed_timestamp = models.TimeField(auto_now_add=True)

    class Meta:
        abstract = True

class Group(UserCreated):
    pass

class Project(UserCreated):
    private = models.BooleanField(default=True)
    group_key = models.ForeignKey(Group, on_delete=models.CASCADE, blank=True, null=True)
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)

class Dataset(UserCreated):
    source_url = models.URLField(max_length=100)
    file_type = models.CharField(max_length=50)
    data_type = models.CharField(max_length=50)
    project_key = models.ForeignKey(Project, on_delete=models.CASCADE, blank=True, null=True)
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)

class VisualizationConf(UserCreated):
    conf = models.JSONField()
    tool = models.CharField(max_length=50)
    tool_version = models.CharField(max_length=50, blank=True)
    project_key = models.ForeignKey(Project, on_delete=models.CASCADE, blank=True, null=True)

class ProjectMember(models.Model):
    class Permissions(models.IntegerChoices):
        read = 1, _("read")
        write = 2, _("write")
        admin = 3, _("admin")
        owner = 4, _("owner")

    project_key = models.ForeignKey(Project, on_delete=models.CASCADE, blank=True, null=True)
    user_key = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    permissions = models.IntegerField(choices=Permissions, default=1)
