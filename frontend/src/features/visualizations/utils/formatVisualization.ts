import type { components } from "../../../types/schema";
import { GoslingDesignerVEC } from "gosling-designer-vec";
import { ComponentProps} from "react";

export default function formatVisualization (
    viz?: components["schemas"]["VisualizationOut"]
  ){
    if (!viz) {
      return undefined;
    }
  
    return {
      note: "",
      name: viz.name,
      id: viz.uuid,
      spec: viz?.conf,
      usedDataIds: [],
      isPublished: viz?.published,
      // name: dataset.source_url.replace(/^.*[\\/]/, ""),
    } as ComponentProps<typeof GoslingDesignerVEC>["visualization"];
  };