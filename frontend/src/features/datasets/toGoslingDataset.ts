import type { GDData } from "gosling-designer-vec";
import type { components } from "@/types/schema";
import { toGoslingAssembly } from "./assemblies";

type Dataset = components["schemas"]["DatasetWithTagsOut"];

/**
 * Build a `chrToGenomicFields` mapping from a CSV dataset's field
 * tuples. Mirrors the algorithm inside gosling-designer-vec: each
 * chromosome-typed field is paired with the (up to) two immediately
 * following genomic-typed fields. Supports paired-region formats
 * (BEDPE) which have two chromosome fields — the second one is picked
 * up as `findLastIndex`-equivalent, distinct from the first.
 *
 * gosling-designer-vec computes this internally when a dataset enters
 * its workspace catalog, but the drop handler (`MRi` in the minified
 * bundle) reads it straight off the drop payload without consulting
 * the catalog. So the drag payload has to include it explicitly.
 */
function computeChrToGenomicFields(
  fields: [string, string][] | null | undefined,
): Record<string, string[]> | undefined {
  if (!fields || fields.length === 0) return undefined;

  const result: Record<string, string[]> = {};

  const collectFor = (idx: number) => {
    if (idx < 0) return;
    const chrName = fields[idx][0];
    const collected: string[] = [];
    for (const offset of [1, 2] as const) {
      const next = fields[idx + offset];
      if (next && next[1] === "genomic") {
        collected.push(next[0]);
      } else {
        break;
      }
    }
    if (collected.length > 0) {
      result[chrName] = collected;
    }
  };

  // `findLastIndex` is ES2023; tsconfig targets ES2020. Manual reverse
  // scan keeps us lib-compat.
  const first = fields.findIndex((f) => f[1] === "chromosome");
  collectFor(first);
  let last = -1;
  for (let i = fields.length - 1; i >= 0; i--) {
    if (fields[i][1] === "chromosome") {
      last = i;
      break;
    }
  }
  if (last !== first) collectFor(last);

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Canonical CVH-dataset-to-Gosling-shape transform. Used by:
 *
 *   1. `GoslingVizShell` when building the workspace's dataset catalog
 *      passed to `AppStateProvider`.
 *   2. `DataList` when populating the DnD payload attached to each
 *      draggable dataset row — so the drop handler (`MRi`) receives
 *      identical shape whether it reads the payload directly or looks
 *      up the catalog entry by id.
 *
 * Keeping both call sites on one function prevents the class of bug
 * where the two shapes drift and a field required by MRi is silently
 * missing from one of them.
 */
export function toGoslingDataset(dataset: Dataset): GDData {
  const dataColumn = (dataset.data_column ?? undefined) as
    | [string, string][]
    | null
    | undefined;
  return {
    type: dataset.file_type,
    name: dataset.name,
    id: dataset.uuid,
    metadata: {},
    url: dataset.source_url,
    // Translate cfdb's raw assembly value to something Gosling can
    // render: a known assembly string, an alias, or inline ChromSizes.
    // See assemblies.ts for the mapping.
    assembly: toGoslingAssembly(dataset.assembly),
    indexURL: dataset.index_url ?? undefined,
    header: dataset.headers ?? undefined,
    separator: dataset.separator ?? undefined,
    note: dataset.description ?? undefined,
    rowNames: dataset.row_names ?? undefined,
    ...(dataset.file_type === "csv"
      ? {
          fields: dataColumn ?? undefined,
          // Include chrToGenomicFields even on the catalog side.
          // gosling-designer-vec's own internal computation is gated
          // by `if (!chrToGenomicFields)`, so setting it here is a
          // no-op for the catalog path and load-bearing for the
          // direct-drop path.
          chrToGenomicFields: computeChrToGenomicFields(dataColumn),
        }
      : { optionalFields: dataColumn ?? undefined }),
    tags: dataset.tags.map((t) => [t.key, t.tag]),
    // TS can't discriminate the union without narrowing on
    // `file_type` first; structurally the object is a valid GDData
    // for whichever file_type the dataset has.
  } as unknown as GDData;
}
