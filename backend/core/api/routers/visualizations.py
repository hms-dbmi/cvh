from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Query, Router
from ninja.pagination import paginate

from ..auth import Authorized
from ..helpers import (
    _get_workspace,
    get_model_tags_in_workspace,
    get_or_create_tags,
)
from ..models import Project, Tag, VisualizationConf
from ..schema import (
    PartialVisualizationUpdate,
    SuccessOut,
    TagOut,
    TagsIn,
    VisualizationIn,
    VisualizationNoConfOut,
    VisualizationOut,
    VisualizationQuerySchema,
)

router = Router(tags=["Visualizations"])


@router.get(
    "/public/visualizations",
    response=list[VisualizationNoConfOut],
    summary="List published visualizations",
    description=(
        "Returns all published visualizations, with optional"
        " filtering by tags or UUIDs. Paginated."
        " No authentication required."
    ),
)
@paginate
def get_published_visualizations(
    request,
    query_filters: VisualizationQuerySchema = Query(...),  # noqa: B008
):
    q = Q()
    if query_filters.tags:
        t = Tag.objects.filter(tag__in=query_filters.tags)
        q &= Q(tags__in=t)
    if query_filters.uuids:
        q &= Q(uuid__in=query_filters.uuids)
    visualizations = (
        VisualizationConf.objects.filter(Q(published=True) & q)
        .order_by("-modified_timestamp")
        .distinct()
    )
    return visualizations


@router.get(
    "/visualizations",
    auth=Authorized(),
    response=list[VisualizationNoConfOut],
    summary="List workspace visualizations",
    description=(
        "Returns visualizations in a workspace, with optional"
        " filtering by tags, name, or UUIDs."
        " Requires read access."
    ),
)
def get_workspace_visualizations(
    request,
    workspace_uuid: str,
    query_filters: VisualizationQuerySchema = Query(...),  # noqa: B008
):
    project = _get_workspace(
        user=request.auth,
        workspace_uuid=workspace_uuid,
        error_message="Visualization not found.",
    )
    q = Q()
    if query_filters.tags:
        t = Tag.objects.filter(uuid__in=query_filters.tags)
        q &= Q(tags__in=t)
    if query_filters.name:
        q &= Q(name__icontains=query_filters.name)
    if query_filters.uuids:
        q &= Q(uuid__in=query_filters.uuids)
    visualizations = (
        VisualizationConf.objects.filter(Q(project_key=project) & q)
        .distinct()
        .order_by("-modified_timestamp")
    )
    return visualizations


@router.get(
    "/visualizations/tags",
    auth=Authorized(),
    response=list[TagOut],
    summary="Get visualization tags",
    description=(
        "Returns all distinct tags used by visualizations"
        " in a workspace."
    ),
)
def get_workspace_visualizations_tags(
    request, workspace_uuid: str
):
    project = Project.objects.get_read_project(
        user=request.auth, project_uuid=workspace_uuid
    )
    return get_model_tags_in_workspace(VisualizationConf, project)


@router.get(
    "/visualizations/{visualization_uuid}",
    response=VisualizationOut,
    auth=Authorized(),
    summary="Get a visualization",
    description=(
        "Returns a single visualization by UUID, including its"
        " full configuration. Requires read access to the"
        " parent workspace."
    ),
)
def get_visualization(request, visualization_uuid: str):
    try:
        visualization = get_object_or_404(
            VisualizationConf, uuid=visualization_uuid
        )
        Project.objects.get_read_project(
            project_uuid=visualization.project_key.uuid,
            user=request.auth,
        )
    except VisualizationConf.DoesNotExist:
        raise Http404("Failed to find visualization.") from None
    except Project.DoesNotExist:
        raise Http404("Failed to find visualization.") from None
    return visualization


@router.get(
    "/public/visualizations/{visualization_uuid}",
    response=VisualizationOut,
    summary="Get a public visualization",
    description=(
        "Returns a single published visualization by UUID."
        " No authentication required."
    ),
)
def get_public_visualization(request, visualization_uuid: str):
    visualization = get_object_or_404(
        VisualizationConf, uuid=visualization_uuid, published=True
    )
    return visualization


@router.delete(
    "/visualizations/{visualization_uuid}",
    auth=Authorized(),
    response=SuccessOut,
    summary="Delete a visualization",
    description=(
        "Permanently deletes a visualization."
        " Requires write access to the parent workspace."
    ),
)
def delete_visualization(request, visualization_uuid: str):
    visualization = get_object_or_404(
        VisualizationConf, uuid=visualization_uuid
    )
    try:
        Project.objects.get_write_project(
            project_uuid=visualization.project_key.uuid,
            user=request.auth,
        )
    except Project.DoesNotExist:
        raise Http404("Failed to delete visualization.") from None

    visualization.delete()
    return {"success": True}


@router.put(
    "/visualizations/{visualization_uuid}",
    auth=Authorized(),
    response=SuccessOut,
    summary="Update a visualization",
    description=(
        "Partially updates a visualization's metadata or"
        " configuration. Sets published_timestamp when"
        " publishing. Requires write access."
    ),
)
def update_visualization(
    request,
    visualization_uuid: str,
    payload: PartialVisualizationUpdate,
):
    payload_dict = payload.dict(exclude_unset=True)
    visualization = get_object_or_404(
        VisualizationConf, uuid=visualization_uuid
    )
    try:
        Project.objects.get_write_project(
            project_uuid=visualization.project_key.uuid,
            user=request.auth,
        )
    except Project.DoesNotExist:
        raise Http404("Failed to update visualization.") from None

    for attr, value in payload_dict.items():
        if attr == "published":
            visualization.published_timestamp = timezone.now()
        setattr(visualization, attr, value)
    visualization.save()
    return {"success": True}


@router.put(
    "/visualizations/{visualization_uuid}/tags",
    auth=Authorized(),
    response=SuccessOut,
    summary="Tag a visualization",
    description=(
        "Replaces all tags on a visualization. Creates any"
        " tags that don't already exist in the workspace."
        " Requires write access."
    ),
)
def tag_visualization(
    request, visualization_uuid: str, payload: TagsIn
):
    visualization = get_object_or_404(
        VisualizationConf, uuid=visualization_uuid
    )
    try:
        project = Project.objects.get_write_project(
            project_uuid=visualization.project_key.uuid,
            user=request.auth,
        )
    except Project.DoesNotExist:
        raise Http404("Failed to tag visualization.") from None
    tags = get_or_create_tags(payload.tags, project=project)
    visualization.tags.set(tags)
    return {"success": True}


@router.post(
    "/visualizations",
    auth=Authorized(),
    response={201: VisualizationNoConfOut},
    summary="Create a visualization",
    description=(
        "Creates a new visualization in a workspace."
        " Requires write access to the workspace."
    ),
)
def create_visualization(request, visualization: VisualizationIn):
    visualization_dict = visualization.dict()
    workspace_uuid = visualization_dict.get("workspace_uuid")
    del visualization_dict["workspace_uuid"]

    try:
        project = Project.objects.get_write_project(
            user=request.auth, project_uuid=workspace_uuid
        )
    except Project.DoesNotExist:
        raise Http404("Failed to create visualization.") from None
    viz = VisualizationConf.objects.create(
        **visualization_dict, project_key=project
    )
    return viz
