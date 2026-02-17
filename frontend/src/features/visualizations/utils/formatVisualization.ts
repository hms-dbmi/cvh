import type { GoslingDesignerVEC } from "gosling-designer-vec";
import type { ComponentProps } from "react";
import type { components } from "../../../types/schema";

export default function formatVisualization(
  viz?: components["schemas"]["VisualizationOut"],
) {
  if (!viz) {
    return undefined;
  }

  return {
    note: viz?.description,
    name: viz.name,
    id: viz.uuid,
    spec: viz?.conf,
    usedDataIds: [],
    isPublished: viz?.published,
    // name: dataset.source_url.replace(/^.*[\\/]/, ""),
  } as ComponentProps<typeof GoslingDesignerVEC>["visualization"];
}
