"""Pydantic models for CVH API responses."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class Tag(BaseModel):
    """A tag attached to a dataset or visualization.

    Tags are workspace-scoped and can be created ad-hoc via the UI or
    the API. `key` is optional and lets you group tags into
    namespaces (e.g. `key="assay"` with `tag="ChIP-seq"`).
    """

    tag: str = Field(description="The tag's label value.")
    key: str | None = Field(
        default=None,
        description="Optional namespace/category the tag belongs to.",
    )
    uuid: str | None = Field(
        default=None,
        description="Backend identifier. Absent on tags being created client-side.",
    )


class Workspace(BaseModel):
    """A collaborative workspace containing datasets and visualizations.

    Users may be members with different permission levels: read (1),
    write (2), or admin (3). Non-members can only see public workspaces.
    """

    uuid: str = Field(description="Unique workspace identifier.")
    name: str = Field(description="Human-readable name shown in the UI.")
    description: str | None = Field(default=None, description="Free-text description.")
    private: bool = Field(
        default=True,
        description=(
            "If True, only members can view the workspace. If False, listed"
            " on the public workspaces endpoint and viewable by anyone."
        ),
    )
    datasets_count: int = Field(description="Number of datasets in the workspace.")
    visualizations_count: int = Field(
        description="Number of visualizations in the workspace."
    )
    permissions: int | None = Field(
        default=None,
        description=(
            "Access level of the authenticated user: 1=read, 2=write, 3=admin."
            " None if the user is not a member (public workspaces only)."
        ),
    )
    created_timestamp: datetime = Field(
        description="When the workspace was first created."
    )
    modified_timestamp: datetime = Field(
        description="When any field or contents last changed."
    )
    last_viewed_timestamp: datetime = Field(
        description="When the authenticated user last opened the workspace."
    )
    workspace_members_count: int | None = Field(
        default=None,
        description=(
            "Number of members with any level of access. Present on the"
            " list-workspaces response; absent on some single-workspace fetches."
        ),
    )


class PagedWorkspaces(BaseModel):
    """One page of workspaces, plus the total count across all pages."""

    items: list[Workspace] = Field(description="Workspaces on this page.")
    count: int = Field(description="Total workspaces matching the query.")


class Dataset(BaseModel):
    """A data source referenced by one or more visualizations.

    CVH itself does not host the bytes — `source_url` points at the
    data (S3, HTTP host, cfdb, etc.). Datasets are workspace-scoped.
    """

    uuid: str = Field(description="Unique dataset identifier.")
    name: str = Field(description="Human-readable name shown in the UI.")
    description: str | None = Field(default=None, description="Free-text description.")
    source_url: str = Field(
        description="URL the visualization tool fetches data bytes from."
    )
    tool: Literal["gosling", "vitessce"] = Field(
        default="gosling",
        description=(
            "Which viewer this dataset was uploaded for. Governs which"
            " workspace's data panel surfaces it — Gosling datasets and"
            " Vitessce datasets don't mix in a single visualization."
        ),
    )
    file_type: str = Field(
        description=(
            "Data format. Depends on `tool`: Gosling recognises bigwig,"
            " cooler, vector, bam, vcf, bed, gff, csv, multivec, beddb;"
            " Vitessce recognises image.ome-tiff, image.ome-zarr,"
            " image.ome-zarr.zip, anndata.zarr, anndata.zarr.zip,"
            " anndata.h5ad, spatialdata.zarr, spatialdata.zarr.zip."
        ),
    )
    data_type: str = Field(
        description=(
            "Free-form data-type label displayed alongside file_type"
            " (e.g. 'signal', 'annotation'). Frequently empty."
        ),
    )
    assembly: str | None = Field(
        default=None,
        description=(
            "Genome assembly the data is aligned to — e.g. hg38, mm10,"
            " dm6, T2T-CHM13. None for coordinate-free formats."
        ),
    )
    data_column: dict | list | None = Field(
        default=None,
        description=(
            "For tabular formats (CSV, BED, VCF, GFF): mapping of column"
            " names to their semantic type (nominal, quantitative,"
            " chromosome, genomic, key)."
        ),
    )
    row_names: list | None = Field(
        default=None,
        description="For multivec: names of the rows (samples/tracks).",
    )
    headers: bool = Field(
        default=False,
        description="For CSV: whether the file has a header row.",
    )
    index_url: str | None = Field(
        default=None,
        description=(
            "For indexed formats (BAM, VCF, BED, GFF): URL of the"
            " sidecar index file (.bai, .tbi, etc.)."
        ),
    )
    separator: str | None = Field(
        default=None,
        description="For CSV: field separator character (e.g. ',' or '\\t').",
    )
    cfdb_dcc: str | None = Field(
        default=None,
        description=(
            "cfdb Data Coordination Center slug (e.g. '4dn', 'encode')."
            " Non-null for datasets added via the Browse Library flow."
        ),
    )
    cfdb_id: str | None = Field(
        default=None,
        description=(
            "cfdb-side identifier for the file. Paired with cfdb_dcc;"
            " the backend derives source_url from these two."
        ),
    )
    processing_status: str = Field(
        default="not_needed",
        description=(
            "State machine for cfdb-backed datasets that need server-side"
            " processing (BAM/VCF/BED/GFF). One of: 'not_needed' (ready"
            " formats or user URL uploads), 'needed' (queued), 'started'"
            " (in flight), 'processed' (terminal, ready to render),"
            " 'failed' (terminal, see processing_error)."
        ),
    )
    processing_job_id: str | None = Field(
        default=None,
        description="cfdb job identifier while processing is in flight.",
    )
    processing_started_at: datetime | None = Field(
        default=None,
        description="When cfdb processing began.",
    )
    processing_completed_at: datetime | None = Field(
        default=None,
        description="When cfdb processing reached a terminal state.",
    )
    processing_error: str | None = Field(
        default=None,
        description="Error message from cfdb if processing_status == 'failed'.",
    )
    created_timestamp: datetime = Field(
        description="When the dataset was added to CVH."
    )
    modified_timestamp: datetime = Field(description="When any field last changed.")
    last_viewed_timestamp: datetime = Field(
        description="When the authenticated user last opened the dataset."
    )
    tags: list[Tag] = Field(default=[], description="Tags attached to this dataset.")


class PagedDatasets(BaseModel):
    """One page of datasets, plus the total count across all pages."""

    items: list[Dataset] = Field(description="Datasets on this page.")
    count: int = Field(description="Total datasets matching the query.")


class VisualizationSummary(BaseModel):
    """Compact view of a visualization used in list responses.

    Excludes the potentially large `conf` blob — fetch the full
    Visualization via `get_visualization` when you need the config.
    """

    uuid: str = Field(description="Unique visualization identifier.")
    name: str = Field(description="Human-readable name shown in the UI.")
    description: str | None = Field(default=None, description="Free-text description.")
    author: str | None = Field(
        default=None,
        description="Attribution string shown alongside the visualization in the UI.",
    )
    tool: str = Field(
        default="gosling",
        description="Rendering tool: 'gosling' or 'vitessce'.",
    )
    published: bool = Field(
        default=False,
        description=(
            "If True, visible on the public visualizations endpoint and"
            " embeddable without authentication."
        ),
    )
    n_tracks: int | None = Field(
        default=0,
        description=(
            "Number of tracks in the visualization's config. Zero for"
            " newly-created visualizations that haven't been configured."
        ),
    )
    n_datasets: int | None = Field(
        default=0,
        description="Number of distinct datasets referenced by the config.",
    )
    published_timestamp: datetime | None = Field(
        default=None,
        description="When the visualization was last published (None if never).",
    )
    created_timestamp: datetime = Field(
        description="When the visualization was created."
    )
    modified_timestamp: datetime = Field(
        description="When the config or metadata last changed."
    )
    last_viewed_timestamp: datetime = Field(
        description="When the authenticated user last opened the visualization."
    )
    tags: list[Tag] = Field(
        default=[], description="Tags attached to this visualization."
    )


class Visualization(VisualizationSummary):
    """A visualization with its full config blob.

    `conf` is the Gosling spec or Vitessce config JSON. Structure
    depends on `tool` — consult the Gosling / Vitessce docs for the
    schema.
    """

    conf: dict[str, Any] | None = Field(
        default=None,
        description=(
            "Gosling spec (for tool='gosling') or Vitessce config"
            " (for tool='vitessce'). None for visualizations that"
            " haven't been configured yet."
        ),
    )


class PagedVisualizations(BaseModel):
    """One page of visualization summaries, plus the total count."""

    items: list[VisualizationSummary] = Field(
        description="Visualization summaries on this page."
    )
    count: int = Field(description="Total visualizations matching the query.")
