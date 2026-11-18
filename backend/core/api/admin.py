"""Django admin registrations for the api app's models.

Loaded automatically by `django.contrib.admin` (the `admin.autodiscover()`
that runs when `admin.site.urls` is included). Defines a `ModelAdmin` per
model so the admin index, change lists, filters, and search behave
sensibly for each entity.
"""

from django.contrib import admin, messages
from django.utils import timezone

from . import models
from .yac_access import Auth0ManagementError, grant_yac_role, remove_yac_role


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
    raw_id_fields = ("project_key", "authors")
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


@admin.register(models.YacAccessRequest)
class YacAccessRequestAdmin(admin.ModelAdmin):
    """Approve, decline or revoke YAC access. Approve and revoke change the
    YAC users role in Auth0 first, and only record the decision if Auth0
    accepted it, so this list never says someone has access they don't.
    Declined or revoked people contact us; approving their request again
    restores access."""

    list_display = ("user", "status", "requested_at", "decided_at")
    list_filter = ("status",)
    search_fields = ("user__username", "user__email")
    ordering = ("-requested_at",)
    actions = ("approve", "decline", "revoke")
    readonly_fields = (
        "user",
        "auth0_user_id",
        "status",
        "requested_at",
        "decided_at",
        "decided_by",
    )

    # Requests come only from the API. Deleting one would leave the role in
    # Auth0 while the profile says "Not Enabled"; revoke instead.
    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def _decide(self, request, access, status):
        access.status = status
        access.decided_at = timezone.now()
        access.decided_by = request.user
        access.save()

    def _with_auth0(self, request, queryset, change_role, status, verb):
        done = 0
        for access in queryset:
            try:
                change_role(access.auth0_user_id)
            except Auth0ManagementError as error:
                self.message_user(
                    request, f"{access.user}: not {verb}. {error}", messages.ERROR
                )
                continue
            self._decide(request, access, status)
            done += 1
        if done:
            note = (
                " Access ends within an hour, when their current YAC token expires."
                if status == models.YacAccessRequest.Status.revoked
                else ""
            )
            self.message_user(
                request, f"{verb.capitalize()} {done}.{note}", messages.SUCCESS
            )

    @admin.action(description="Approve: add the YAC users role in Auth0")
    def approve(self, request, queryset):
        self._with_auth0(
            request,
            queryset.exclude(status=models.YacAccessRequest.Status.approved),
            grant_yac_role,
            models.YacAccessRequest.Status.approved,
            "approved",
        )

    @admin.action(description="Decline")
    def decline(self, request, queryset):
        pending = queryset.filter(status=models.YacAccessRequest.Status.pending)
        for access in pending:
            self._decide(request, access, models.YacAccessRequest.Status.declined)
        self.message_user(request, f"Declined {len(pending)}.", messages.SUCCESS)

    @admin.action(description="Revoke: remove the YAC users role in Auth0")
    def revoke(self, request, queryset):
        self._with_auth0(
            request,
            queryset.filter(status=models.YacAccessRequest.Status.approved),
            remove_yac_role,
            models.YacAccessRequest.Status.revoked,
            "revoked",
        )
