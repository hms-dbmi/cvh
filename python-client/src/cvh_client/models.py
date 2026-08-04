"""Pydantic models for CVH API responses."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class Tag(BaseModel):
    tag: str
    key: str | None = None
    uuid: str | None = None


class Workspace(BaseModel):
    uuid: str
    name: str
    description: str | None = None
    private: bool = True
    datasets_count: int
    visualizations_count: int
    permissions: int | None = None
    created_timestamp: datetime
    modified_timestamp: datetime
    last_viewed_timestamp: datetime
    workspace_members_count: int | None = None


class PagedWorkspaces(BaseModel):
    items: list[Workspace]
    count: int


class Dataset(BaseModel):
    uuid: str
    name: str
    description: str | None = None
    source_url: str
    file_type: str
    data_type: str
    assembly: str | None = None
    data_column: dict | list | None = None
    row_names: list | None = None
    headers: bool = False
    index_url: str | None = None
    separator: str | None = None
    # cfdb-backed datasets (added via the Browse Library flow) carry
    # `cfdb_dcc` + `cfdb_id`; the backend derives `source_url` from
    # them. User-added datasets (raw URL uploads) leave both null.
    cfdb_dcc: str | None = None
    cfdb_id: str | None = None
    # Processing state — populated for cfdb-sourced datasets in
    # formats that require server-side processing (BAM/VCF/BED/GFF).
    # "not_needed" for ready formats (bigwig/cooler/vector) and for
    # user-added URL uploads. Terminal states: "processed", "failed".
    processing_status: str = "not_needed"
    processing_job_id: str | None = None
    processing_started_at: datetime | None = None
    processing_completed_at: datetime | None = None
    processing_error: str | None = None
    created_timestamp: datetime
    modified_timestamp: datetime
    last_viewed_timestamp: datetime
    tags: list[Tag] = []


class PagedDatasets(BaseModel):
    items: list[Dataset]
    count: int


class VisualizationSummary(BaseModel):
    uuid: str
    name: str
    description: str | None = None
    author: str | None = None
    tool: str = "gosling"
    published: bool = False
    n_tracks: int | None = 0
    n_datasets: int | None = 0
    published_timestamp: datetime | None = None
    created_timestamp: datetime
    modified_timestamp: datetime
    last_viewed_timestamp: datetime
    tags: list[Tag] = []


class Visualization(VisualizationSummary):
    conf: dict[str, Any] | None = None


class PagedVisualizations(BaseModel):
    items: list[VisualizationSummary]
    count: int
