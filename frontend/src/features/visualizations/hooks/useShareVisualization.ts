import { useCallback } from "react";
import posthog from "@/posthog";
import { useHandleCopyClick } from "@/utils/useHandleCopyText";

// Where a sharing action came from, so analytics can tell the workspace's
// sharing menu apart from the public page's sharing bar.
export type ShareSource = "sharing_menu" | "public_page";

interface ShareTarget {
  visualizationID: string;
  // "gosling" | "vitessce", recorded on every sharing event.
  viewer?: string;
  source: ShareSource;
}

/**
 * The copy-link action for a published visualization, shared by the
 * workspace's sharing menu and the public page's sharing bar.
 */
export function useShareVisualization({
  visualizationID,
  viewer,
  source,
}: ShareTarget) {
  const handleCopyClick = useHandleCopyClick();
  const path = `/visualizations/${visualizationID}`;
  const publicUrl = `${window.location.origin}${path}`;

  const copyLink = useCallback(() => {
    posthog.capture("visualization_link_copied", { viewer, source });
    handleCopyClick(publicUrl);
  }, [handleCopyClick, publicUrl, viewer, source]);

  return { path, copyLink };
}
