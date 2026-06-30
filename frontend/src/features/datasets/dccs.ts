/**
 * Supported Data Coordinating Centers (DCCs) for cfdb-backed datasets.
 *
 * Mirrored from `backend/core/api/dccs.py`. Adding a DCC requires cfdb-side
 * support — coordinate with the cfdb maintainers before extending.
 */

export const SUPPORTED_DCCS = ["encode", "4dn"] as const;

export type Dcc = (typeof SUPPORTED_DCCS)[number];

export const DCC_LABELS: Record<Dcc, string> = {
  encode: "ENCODE",
  "4dn": "4DN",
};
