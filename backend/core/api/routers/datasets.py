import contextlib
from typing import Literal

from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from ninja import Query, Router
from ninja.pagination import PageNumberPagination, paginate

from ..auth import Authorized
from ..examples import EXAMPLE_DATASETS
from ..helpers import _get_project, get_model_tags_in_project, get_or_create_tags
from ..models import Dataset, Project, Tag, VisualizationConf
from ..schema import (
    DatasetIn,
    DatasetOut,
    DatasetQuerySchema,
    DatasetUpdate,
    DatasetWithTagsOut,
    ExampleDatasetIn,
    SuccessOut,
    TagOut,
    TagsIn,
)

router = Router(tags=["Datasets"])


@router.post(
    "/datasets",
    auth=Authorized(),
    response={201: DatasetIn},
    summary="Create a dataset",
    description=(
        "Creates a new dataset. If project_uuid is provided,"
        " requires write access to that project."
        " Otherwise associates with the user directly."
    ),
)
def create_dataset(request, dataset: DatasetIn):
    dataset_dict = dataset.dict()
    project_uuid = dataset_dict.get("project_uuid")
    del dataset_dict["project_uuid"]

    if project_uuid:
        try:
            project = Project.objects.get_write_project(
                user=request.auth, project_uuid=project_uuid
            )
            Dataset.objects.create(**dataset_dict["dataset"], project_key=project)
            return dataset
        except Project.DoesNotExist:
            raise Http404("Failed to create dataset.") from None
    Dataset.objects.create(**dataset_dict["dataset"], user_key=request.auth)
    return dataset


@router.post(
    "/examples",
    auth=Authorized(),
    response=SuccessOut,
    summary="Add example datasets",
    description=(
        "Populates a project with pre-configured example"
        " datasets and optionally visualizations."
        " Requires write access."
    ),
)
def create_example_datasets(request, payload: ExampleDatasetIn):
    try:
        project = Project.objects.get_write_project(
            user=request.auth, project_uuid=payload.project_uuid
        )
    except Project.DoesNotExist:
        raise Http404("Failed to add example data.") from None

    example = EXAMPLE_DATASETS[payload.example_id]
    data = example.get("data", [])

    for d in data:
        dataset_tags = d.get("tags", [])
        with contextlib.suppress(KeyError):
            del d["tags"]

        dataset = Dataset.objects.create(**d, project_key=project)
        tags = get_or_create_tags(dataset_tags, project=project)
        dataset.tags.set(tags)

    if payload.include_visualizations:
        viz = example.get("visualization", {})
        VisualizationConf.objects.create(**viz, project_key=project)

    return {"success": True}


@router.put(
    "/datasets",
    auth=Authorized(),
    response=SuccessOut,
    summary="Update a dataset",
    description=(
        "Partially updates a dataset's metadata. Requires write"
        " access to the parent project, or ownership if no project."
    ),
)
def update_dataset(request, payload: DatasetUpdate):
    payload_dict = payload.dict(exclude_unset=True)
    if payload.project_uuid:
        project = Project.objects.get_write_project(
            project_uuid=payload.project_uuid, user=request.auth
        )
        dataset = get_object_or_404(Dataset, uuid=payload.uuid, project_key=project)
        del payload_dict["project_uuid"]
    else:
        dataset = get_object_or_404(Dataset, uuid=payload.uuid, user_key=request.auth)

    del payload_dict["uuid"]
    for attr, value in payload_dict.items():
        setattr(dataset, attr, value)
    dataset.save()
    return {"success": True}


@router.put(
    "/datasets/tags",
    auth=Authorized(),
    response=SuccessOut,
    summary="Tag a dataset",
    description=(
        "Replaces all tags on a dataset. Creates any tags that"
        " don't already exist in the project. Requires write access."
    ),
)
def tag_dataset(request, payload: TagsIn):
    try:
        project = Project.objects.get_write_project(
            project_uuid=payload.project_uuid, user=request.auth
        )
    except Project.DoesNotExist:
        raise Http404("Failed to tag dataset.") from None

    dataset = get_object_or_404(Dataset, uuid=payload.uuid, project_key=project)
    tags = get_or_create_tags(payload.tags, project=project)
    dataset.tags.set(tags)
    return {"success": True}


@router.get(
    "/datasets",
    auth=Authorized(),
    response=list[DatasetOut],
    summary="List user datasets",
    description=(
        "Returns all datasets owned directly by the"
        " authenticated user (not via project). Paginated."
    ),
)
@paginate
def get_user_datasets(request):
    datasets = Dataset.objects.filter(user_key=request.auth)
    return datasets


@router.get(
    "/datasets/{project_uuid}",
    auth=Authorized(),
    response=list[DatasetWithTagsOut],
    summary="List project datasets",
    description=(
        "Returns datasets in a project, with optional filtering"
        " by tags, assembly, file type, or name. Paginated."
    ),
)
@paginate(PageNumberPagination)
def get_project_datasets(
    request,
    project_uuid: str,
    query_filters: DatasetQuerySchema = Query(...),  # noqa: B008
):
    project = _get_project(
        user=request.auth, project_uuid=project_uuid, error_message="Dataset not found."
    )
    q = Q()
    if query_filters.tags:
        t = Tag.objects.filter(uuid__in=query_filters.tags)
        q &= Q(tags__in=t)
    if query_filters.assembly:
        q &= Q(assembly__in=query_filters.assembly)
    if query_filters.file_type:
        q &= Q(file_type__in=query_filters.file_type)
    if query_filters.name:
        q &= Q(name__icontains=query_filters.name)
    datasets = (
        Dataset.objects.filter(Q(project_key=project) & q)
        .order_by("-modified_timestamp")
        .distinct()
    )

    return datasets


@router.get(
    "/datasets/fields/{project_uuid}",
    auth=Authorized(),
    response=list[str],
    summary="Get dataset field values",
    description=(
        "Returns distinct values for a given field"
        " (assembly or file_type) across all datasets in a"
        " project. Useful for populating filter dropdowns."
    ),
)
def get_project_datasets_field_values(
    request, project_uuid: str, field: Literal["assembly", "file_type"]
):
    project = Project.objects.get_read_project(
        user=request.auth, project_uuid=project_uuid
    )
    field_values = (
        Dataset.objects.filter(Q(project_key=project))
        .values_list(field, flat="true")
        .distinct()
    )
    return field_values


@router.get(
    "/datasets/tags/{project_uuid}",
    auth=Authorized(),
    response=list[TagOut],
    summary="Get dataset tags",
    description="Returns all distinct tags used by datasets in a project.",
)
def get_project_datasets_tags(request, project_uuid: str):
    project = Project.objects.get_read_project(
        user=request.auth, project_uuid=project_uuid
    )
    return get_model_tags_in_project(Dataset, project)


@router.get(
    "/datasets/uuid/{dataset_uuid}",
    auth=Authorized(),
    response=DatasetWithTagsOut,
    summary="Get a dataset",
    description=(
        "Returns a single dataset by UUID, including its tags."
        " Requires read access to the parent project."
    ),
)
def get_dataset(request, dataset_uuid: str):
    dataset = get_object_or_404(Dataset, uuid=dataset_uuid)
    try:
        Project.objects.get_read_project(
            project_uuid=dataset.project_key.uuid, user=request.auth
        )
    except Project.DoesNotExist:
        raise Http404("Dataset not found.") from None

    return dataset


@router.delete(
    "/datasets/uuid/{dataset_uuid}",
    auth=Authorized(),
    response=SuccessOut,
    summary="Delete a dataset",
    description=(
        "Permanently deletes a dataset."
        " Requires write access to the parent project."
    ),
)
def delete_dataset(request, dataset_uuid: str):
    dataset = get_object_or_404(Dataset, uuid=dataset_uuid)
    try:
        Project.objects.get_write_project(
            project_uuid=dataset.project_key.uuid, user=request.auth
        )
    except Project.DoesNotExist:
        raise Http404("Failed to delete dataset.") from None

    dataset.delete()
    return {"success": True}
