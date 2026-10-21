import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  ArrowSquareOut,
  LinkSimple,
  LockSimple,
  PresentationChart,
} from "@phosphor-icons/react";
import { useCallback } from "react";
import { useSnackbarActions } from "@/components/Snackbar/useSnackbarStore";
import { LinkMenuItem } from "@/features/navigation/components/Links";
import posthog from "@/posthog";
import { useUpdateVisualization } from "../api/useVisualizations";
import {
  type ShareSource,
  useShareVisualization,
} from "../hooks/useShareVisualization";

type Props = {
  visualizationID: string;
  // Tags analytics events. Passed in rather than fetched, since public
  // visitors can't read the workspace API.
  viewer?: string;
  source?: ShareSource;
  closeMenu: () => void;
  onUnpublish?: () => void;
  // Read-only members can share a published visualization but not make it
  // private, so the menu hides that item for them.
  canUnpublish?: boolean;
  // Hidden on the public page, which is already the public view.
  showOpenPublicView?: boolean;
};

const ICON_SIZE = 20;

// "Sharing Menu Item" in the CVH design system.
const menuItemSx: SxProps<Theme> = {
  gap: 1,
  height: 48,
  px: 1.5,
  borderRadius: 3,
  typography: "button",
  color: "text.primary",
  "&:hover": { bgcolor: "rgba(138, 158, 168, 0.04)" },
};

function PublishedVizMenu({
  visualizationID,
  viewer,
  source = "sharing_menu",
  closeMenu,
  onUnpublish,
  canUnpublish = true,
  showOpenPublicView = true,
}: Props) {
  const { toastError } = useSnackbarActions();
  const { path, copyLink } = useShareVisualization({
    visualizationID,
    viewer,
    source,
  });

  const handleOpenPublicView = useCallback(() => {
    posthog.capture("visualization_public_view_opened", { viewer, source });
    closeMenu();
  }, [viewer, source, closeMenu]);

  const handleCopy = useCallback(() => {
    copyLink();
    closeMenu();
  }, [copyLink, closeMenu]);

  const { mutate: updateViz } = useUpdateVisualization();

  const unPublishViz = useCallback(() => {
    try {
      if (!visualizationID) {
        return;
      }
      posthog.capture("visualization_unpublished");
      updateViz({
        body: { published: false },
        params: {
          path: { visualization_uuid: visualizationID },
        },
      });
      onUnpublish?.();
      closeMenu();
    } catch (e) {
      toastError("Error publishing visualization");
      console.error(e);
    }
  }, [updateViz, toastError, visualizationID, closeMenu, onUnpublish]);

  return (
    <>
      {showOpenPublicView && (
        <LinkMenuItem
          to={path}
          target="_blank"
          component="a"
          onClick={handleOpenPublicView}
          sx={menuItemSx}
        >
          <PresentationChart size={ICON_SIZE} />
          Open Public View
          <ArrowSquareOut size={ICON_SIZE} style={{ marginLeft: "auto" }} />
        </LinkMenuItem>
      )}
      <MenuItem onClick={handleCopy} sx={menuItemSx}>
        <LinkSimple size={ICON_SIZE} />
        Copy link
      </MenuItem>
      {canUnpublish && <Divider />}
      {canUnpublish && (
        <MenuItem onClick={unPublishViz} sx={menuItemSx}>
          <LockSimple size={ICON_SIZE} />
          Make Private
        </MenuItem>
      )}
    </>
  );
}

export default PublishedVizMenu;
