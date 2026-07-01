"""Supported Data Coordinating Centers (DCCs) for cfdb-backed datasets.

Mirrored to `frontend/src/features/datasets/dccs.ts`. Adding a DCC requires
cfdb-side support — coordinate with the cfdb maintainers before extending.
"""

from typing import Final

SUPPORTED_DCCS: Final[tuple[str, ...]] = ("encode", "4dn")
