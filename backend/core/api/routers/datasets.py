from typing import Literal
from uuid import UUID

from django.conf import settings
from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Query, Router
from ninja.errors import HttpError
from ninja.pagination import PageNumberPagination, paginate

from ..auth import Authorized
from ..cfdb import CfdbError, check_artifact_ready, dispatch_artifact
from ..dccs import SUPPORTED_DCCS
from ..examples import EXAMPLE_DATASETS
from ..helpers import (
    _get_workspace,
    get_model_tags_in_workspace,
    get_or_create_tags,
)
from ..models import Dataset, Project, Tag, VisualizationConf
from ..schema import (
    DatasetIn,
    DatasetOut,
    DatasetQuerySchema,
    DatasetUpdate,
    DatasetWithTagsOut,
    ExampleDatasetIn,
    ProcessingOut,
    ProcessingStatusUpdate,
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
        "Creates a new dataset. If workspace_uuid is provided,"
        " requires write access to that workspace."
        " Otherwise associates with the user directly."
    ),
)
def create_dataset(request, dataset: DatasetIn):
    dataset_dict = dataset.dict()
    workspace_uuid = dataset_dict.get("workspace_uuid")
    del dataset_dict["workspace_uuid"]

    fields = _apply_cfdb_source(dataset_dict["dataset"])

    if workspace_uuid:
        try:
            project = Project.objects.get_write_project(
                user=request.auth, project_uuid=workspace_uuid
            )
            Dataset.objects.create(**fields, project_key=project)
            return dataset
        except Project.DoesNotExist:
            raise Http404("Failed to create dataset.") from None
    Dataset.objects.create(**fields, user_key=request.auth)
    return dataset


def _apply_cfdb_source(fields: dict) -> dict:
    """If the payload carries cfdb identifiers, validate the DCC and derive
    `source_url` (and `index_url` for indexed file types) from cfdb's
    `/data/{dcc}/{id}` and `/index/{dcc}/{id}` endpoints. The user-supplied
    URLs are ignored for cfdb-sourced datasets so the backend stays in
    control of where bytes come from.
    """
    dcc = fields.get("cfdb_dcc")
    cfdb_id = fields.get("cfdb_id")
    if not dcc and not cfdb_id:
        return fields

    if dcc not in SUPPORTED_DCCS:
        raise HttpError(
            400,
            f"Unsupported DCC '{dcc}'. Supported: {', '.join(SUPPORTED_DCCS)}.",
        )

    base = settings.CFDB_BASE_URL
    resolved: dict = {
        **fields,
        "source_url": f"{base}/data/{dcc}/{cfdb_id}",
    }
    # cfdb produces a sidecar index for the formats that need one. Set
    # index_url at creation time so the dataset row carries everything
    # Gosling needs once processing completes. The URL is deterministic;
    # both data + index are served from the same cfdb hostname.
    if fields.get("file_type") in _CFDB_INDEXED_FILE_TYPES:
        resolved["index_url"] = f"{base}/index/{dcc}/{cfdb_id}"
    return resolved


# File types whose Gosling schema requires an `index_url`. Stays in sync
# with `GoslingDesignerBam` and `GoslingDesignerIndex` in api/schema.py.
_CFDB_INDEXED_FILE_TYPES = frozenset({"bam", "vcf", "bed", "gff"})


@router.post(
    "/examples",
    auth=Authorized(),
    response=SuccessOut,
    summary="Add example datasets",
    description=(
        "Populates a workspace with pre-configured example"
        " datasets and optionally visualizations."
        " Requires write access."
    ),
)
def create_example_datasets(request, payload: ExampleDatasetIn):
    try:
        project = Project.objects.get_write_project(
            user=request.auth,
            project_uuid=payload.workspace_uuid,
        )
    except Project.DoesNotExist:
        raise Http404("Failed to add example data.") from None

    example = EXAMPLE_DATASETS[payload.example_id]
    data = example.get("data", [])

    for d in data:
        dataset_tags = d.get("tags", [])
        # Copy and remove tags to avoid passing to ORM, without mutating the original
        d = {k: v for k, v in d.items() if k != "tags"}

        dataset = Dataset.objects.create(**d, project_key=project)
        tags = get_or_create_tags(dataset_tags, project=project)
        dataset.tags.set(tags)

    if payload.include_visualizations:
        viz = example.get("visualization", {})
        VisualizationConf.objects.create(**viz, project_key=project)

    return {"success": True}


@router.put(
    "/datasets/{dataset_uuid}",
    auth=Authorized(),
    response=SuccessOut,
    summary="Update a dataset",
    description=(
        "Partially updates a dataset's metadata. Requires"
        " write access to the parent workspace."
    ),
)
def update_dataset(
    request, dataset_uuid: UUID, payload: DatasetUpdate
):
    dataset = get_object_or_404(Dataset, uuid=dataset_uuid)
    try:
        Project.objects.get_write_project(
            project_uuid=dataset.project_key.uuid,
            user=request.auth,
        )
    except Project.DoesNotExist:
        raise Http404("Failed to update dataset.") from None

    payload_dict = payload.dict(exclude_unset=True)
    for attr, value in payload_dict.items():
        setattr(dataset, attr, value)
    dataset.save()
    return {"success": True}


@router.put(
    "/datasets/{dataset_uuid}/tags",
    auth=Authorized(),
    response=SuccessOut,
    summary="Tag a dataset",
    description=(
        "Replaces all tags on a dataset. Creates any tags that"
        " don't already exist in the workspace."
        " Requires write access."
    ),
)
def tag_dataset(request, dataset_uuid: UUID, payload: TagsIn):
    dataset = get_object_or_404(Dataset, uuid=dataset_uuid)
    try:
        project = Project.objects.get_write_project(
            project_uuid=dataset.project_key.uuid,
            user=request.auth,
        )
    except Project.DoesNotExist:
        raise Http404("Failed to tag dataset.") from None

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
        " authenticated user (not via workspace). Paginated."
    ),
)
@paginate
def get_user_datasets(request):
    datasets = Dataset.objects.filter(user_key=request.auth)
    return datasets


@router.get(
    "/workspaces/{workspace_uuid}/datasets",
    auth=Authorized(),
    response=list[DatasetWithTagsOut],
    summary="List workspace datasets",
    description=(
        "Returns datasets in a workspace, with optional"
        " filtering by tags, assembly, file type, or name."
        " Paginated."
    ),
)
@paginate(PageNumberPagination)
def get_workspace_datasets(
    request,
    workspace_uuid: UUID,
    query_filters: DatasetQuerySchema = Query(...),  # noqa: B008
):
    project = _get_workspace(
        user=request.auth,
        workspace_uuid=workspace_uuid,
        error_message="Dataset not found.",
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
    "/workspaces/{workspace_uuid}/datasets/fields",
    auth=Authorized(),
    response=list[str],
    summary="Get dataset field values",
    description=(
        "Returns distinct values for a given field"
        " (assembly or file_type) across all datasets in a"
        " workspace. Useful for populating filter dropdowns."
    ),
)
def get_workspace_datasets_field_values(
    request,
    workspace_uuid: UUID,
    field: Literal["assembly", "file_type"],
):
    project = Project.objects.get_read_project(
        user=request.auth, project_uuid=workspace_uuid
    )
    field_values = (
        Dataset.objects.filter(Q(project_key=project))
        .values_list(field, flat="true")
        .distinct()
    )
    return field_values


@router.get(
    "/workspaces/{workspace_uuid}/datasets/tags",
    auth=Authorized(),
    response=list[TagOut],
    summary="Get dataset tags",
    description=(
        "Returns all distinct tags used by datasets"
        " in a workspace."
    ),
)
def get_workspace_datasets_tags(request, workspace_uuid: UUID):
    project = Project.objects.get_read_project(
        user=request.auth, project_uuid=workspace_uuid
    )
    return get_model_tags_in_workspace(Dataset, project)


@router.get(
    "/datasets/{dataset_uuid}",
    auth=Authorized(),
    response=DatasetWithTagsOut,
    summary="Get a dataset",
    description=(
        "Returns a single dataset by UUID, including its tags."
        " Requires read access to the parent workspace."
    ),
)
def get_dataset(request, dataset_uuid: UUID):
    dataset = get_object_or_404(Dataset, uuid=dataset_uuid)
    try:
        Project.objects.get_read_project(
            project_uuid=dataset.project_key.uuid,
            user=request.auth,
        )
    except Project.DoesNotExist:
        raise Http404("Dataset not found.") from None

    return dataset


@router.delete(
    "/datasets/{dataset_uuid}",
    auth=Authorized(),
    response=SuccessOut,
    summary="Delete a dataset",
    description=(
        "Permanently deletes a dataset."
        " Requires write access to the parent workspace."
    ),
)
def delete_dataset(request, dataset_uuid: UUID):
    dataset = get_object_or_404(Dataset, uuid=dataset_uuid)
    try:
        Project.objects.get_write_project(
            project_uuid=dataset.project_key.uuid,
            user=request.auth,
        )
    except Project.DoesNotExist:
        raise Http404("Failed to delete dataset.") from None

    dataset.delete()
    return {"success": True}


@router.post(
    "/datasets/{dataset_uuid}/process",
    auth=Authorized(),
    response=ProcessingOut,
    summary="Start cfdb processing for a dataset",
    description=(
        "Dispatches the next-needed cfdb workflow for a cfdb-sourced"
        " dataset. Only /data or /index is dispatched per call — cfdb"
        " auto-queues the index workflow once data finishes, so the"
        " frontend re-calls /processing-status when polling completes"
        " and the server advances the phase. Requires write access to"
        " the parent workspace."
    ),
)
def process_dataset(request, dataset_uuid: UUID):
    dataset = get_object_or_404(Dataset, uuid=dataset_uuid)
    try:
        Project.objects.get_write_project(
            project_uuid=dataset.project_key.uuid,
            user=request.auth,
        )
    except Project.DoesNotExist:
        raise Http404("Dataset not found.") from None

    if not (dataset.cfdb_dcc and dataset.cfdb_id):
        raise HttpError(
            400,
            "Only cfdb-sourced datasets can be processed via this endpoint.",
        )

    # Allow dispatch from NEEDED (initial) and FAILED (retry). Disallow
    # dispatching while a job is already in flight or already complete —
    # the caller should refresh.
    if dataset.processing_status not in (
        Dataset.ProcessingStatus.NEEDED,
        Dataset.ProcessingStatus.FAILED,
    ):
        raise HttpError(
            409,
            f"Dataset is in state '{dataset.processing_status}'; cannot"
            " dispatch processing.",
        )

    _advance_processing(dataset)
    return dataset


def _advance_processing(dataset: Dataset) -> None:
    """Advance the dataset's processing state one phase forward based on
    cfdb's current readiness. Encodes the two-phase contract: data is
    dispatched first; cfdb auto-queues the index workflow once data
    completes, so we only need to *fetch* the index job id (by hitting
    /index/{dcc}/{id}) once data is ready.

    Phase logic:
      both /data and /index ready  → PROCESSED
      /data ready, /index pending  → dispatch /index, STARTED with new job_id
      /data not ready              → dispatch /data,  STARTED with data job_id
                                     (cfdb queues /index automatically when
                                     data finishes — caller will hit /index
                                     once that job completes)
    """
    needs_index = dataset.file_type in _CFDB_INDEXED_FILE_TYPES
    try:
        data_ready = check_artifact_ready(
            dataset.cfdb_dcc, dataset.cfdb_id, kind="data"
        )
        index_ready = (
            check_artifact_ready(
                dataset.cfdb_dcc, dataset.cfdb_id, kind="index"
            )
            if needs_index
            else True
        )
    except CfdbError as exc:
        dataset.processing_status = Dataset.ProcessingStatus.FAILED
        dataset.processing_error = str(exc)
        dataset.save(
            update_fields=[
                "processing_status",
                "processing_error",
                "modified_timestamp",
            ]
        )
        raise HttpError(502, f"cfdb status check failed: {exc}") from exc

    now = timezone.now()

    if data_ready and index_ready:
        dataset.processing_status = Dataset.ProcessingStatus.PROCESSED
        dataset.processing_completed_at = now
        dataset.processing_error = None
        dataset.save(
            update_fields=[
                "processing_status",
                "processing_completed_at",
                "processing_error",
                "modified_timestamp",
            ]
        )
        return

    # Decide which single side to dispatch next. We never dispatch both
    # at once — cfdb will auto-queue the index once data finishes.
    next_kind = "data" if not data_ready else "index"

    try:
        result = dispatch_artifact(
            dataset.cfdb_dcc, dataset.cfdb_id, kind=next_kind
        )
    except CfdbError as exc:
        dataset.processing_status = Dataset.ProcessingStatus.FAILED
        dataset.processing_error = str(exc)
        dataset.save(
            update_fields=[
                "processing_status",
                "processing_error",
                "modified_timestamp",
            ]
        )
        raise HttpError(502, f"cfdb dispatch failed: {exc}") from exc

    if result.status_code == 202:
        # New job dispatched — track its id. If we're advancing from data
        # phase to index phase, this replaces the prior (already-finished)
        # data job_id so the frontend polls the right thing next.
        dataset.processing_status = Dataset.ProcessingStatus.STARTED
        dataset.processing_job_id = result.job_id
        if dataset.processing_started_at is None:
            dataset.processing_started_at = now
        dataset.processing_error = None
        dataset.save(
            update_fields=[
                "processing_status",
                "processing_job_id",
                "processing_started_at",
                "processing_error",
                "modified_timestamp",
            ]
        )
        return

    # Race: /status said not-ready but the dispatch returned 200/206.
    # Recurse — re-probe and see if both sides are now ready.
    _advance_processing(dataset)


@router.put(
    "/datasets/{dataset_uuid}/processing-status",
    auth=Authorized(),
    response=ProcessingOut,
    summary="Report cfdb processing outcome",
    description=(
        "Called by the frontend when its polled cfdb job reaches a terminal"
        " state. The server re-probes cfdb's /status endpoints to decide"
        " what's next: marking PROCESSED if both /data and /index are"
        " ready, or dispatching /index and persisting the new job_id if"
        " only the data side just finished. A reported failure is trusted"
        " and marks the row FAILED."
        " Requires write access to the parent workspace."
    ),
)
def update_processing_status(
    request, dataset_uuid: UUID, payload: ProcessingStatusUpdate
):
    dataset = get_object_or_404(Dataset, uuid=dataset_uuid)
    try:
        Project.objects.get_write_project(
            project_uuid=dataset.project_key.uuid,
            user=request.auth,
        )
    except Project.DoesNotExist:
        raise Http404("Dataset not found.") from None

    if dataset.processing_status != Dataset.ProcessingStatus.STARTED:
        raise HttpError(
            409,
            f"Dataset is in state '{dataset.processing_status}'; only"
            " 'started' jobs may be marked complete.",
        )

    # Client-reported failure: trust the client, no point probing cfdb.
    if payload.status == "failed":
        dataset.processing_status = Dataset.ProcessingStatus.FAILED
        dataset.processing_completed_at = timezone.now()
        dataset.processing_error = payload.error
        dataset.save(
            update_fields=[
                "processing_status",
                "processing_completed_at",
                "processing_error",
                "modified_timestamp",
            ]
        )
        return dataset

    # Client says the polled job completed. Verify with cfdb and decide
    # whether we're done (both /data and /index ready) or whether we
    # need to advance to the index phase. `_advance_processing` handles
    # both transitions: it'll dispatch /index if data just finished and
    # index isn't ready yet, replacing the persisted job_id with the
    # new one so the frontend polls the next phase.
    _advance_processing(dataset)
    return dataset
