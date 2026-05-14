"""Django admin registrations for the api app's models.

Loaded automatically by `django.contrib.admin` (the `admin.autodiscover()`
that runs when `admin.site.urls` is included). Defines a `ModelAdmin` per
model so the admin index, change lists, filters, and search behave
sensibly for each entity.
"""

from django.contrib import admin

from . import models


@admin.register(models.Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ("name", "uuid", "created_timestamp", "modified_timestamp")
    search_fields = ("name", "description")
    readonly_fields = (
        "uuid",
        "created_timestamp",
        "modified_timestamp",
        "last_viewed_timestamp",
    )


@admin.register(models.Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "private",
        "user_key",
        "group_key",
        "created_timestamp",
        "modified_timestamp",
    )
    list_filter = ("private",)
    search_fields = ("name", "description")
    raw_id_fields = ("user_key", "group_key")
    readonly_fields = (
        "uuid",
        "created_timestamp",
        "modified_timestamp",
        "last_viewed_timestamp",
    )


@admin.register(models.Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("key", "tag", "project_key")
    search_fields = ("key", "tag")
    raw_id_fields = ("project_key",)
    readonly_fields = ("uuid",)


@admin.register(models.Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "file_type",
        "assembly",
        "project_key",
        "user_key",
        "modified_timestamp",
    )
    list_filter = ("file_type", "assembly")
    search_fields = ("name", "description", "source_url")
    raw_id_fields = ("project_key", "user_key")
    filter_horizontal = ("tags",)
    readonly_fields = (
        "uuid",
        "created_timestamp",
        "modified_timestamp",
        "last_viewed_timestamp",
    )


@admin.register(models.VisualizationConf)
class VisualizationConfAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "tool",
        "published",
        "project_key",
        "author",
        "n_tracks",
        "n_datasets",
        "modified_timestamp",
    )
    list_filter = ("tool", "published")
    search_fields = ("name", "description", "author")
    raw_id_fields = ("project_key",)
    filter_horizontal = ("tags",)
    readonly_fields = (
        "uuid",
        "created_timestamp",
        "modified_timestamp",
        "last_viewed_timestamp",
        "published_timestamp",
    )


@admin.register(models.ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ("project_key", "user_key", "permissions")
    list_filter = ("permissions",)
    raw_id_fields = ("project_key", "user_key")
    search_fields = ("user_key__username", "user_key__email")
