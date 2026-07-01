"""Format-eligibility map: which dataset file types require server-side
processing via the cfdb workflow, and which processor handles each.

Mirrored to `frontend/src/features/datasets/formatEligibility.ts`. When cfdb
adds a processable format, update both files in the same PR.
"""

from enum import StrEnum
from typing import Final


class Processor(StrEnum):
    """cfdb-side processor family. See cfdb's README for workflow details."""

    BAM_INDEX = "bam_index"
    TABIX_INTERVAL = "tabix_interval"


# Formats that need server-side processing before they're usable as tracks.
# Maps file_type → processor that handles it.
PROCESSABLE_FORMATS: Final[dict[str, Processor]] = {
    "bam": Processor.BAM_INDEX,
    "sam": Processor.BAM_INDEX,
    "vcf": Processor.TABIX_INTERVAL,
    "gff": Processor.TABIX_INTERVAL,
    "gff3": Processor.TABIX_INTERVAL,
    "gtf": Processor.TABIX_INTERVAL,
    "bed": Processor.TABIX_INTERVAL,
    "broadpeak": Processor.TABIX_INTERVAL,
    "narrowpeak": Processor.TABIX_INTERVAL,
    "bigbed": Processor.TABIX_INTERVAL,
}


def is_processable(file_type: str) -> bool:
    """True if this file_type requires processing before use."""
    return file_type.lower() in PROCESSABLE_FORMATS
