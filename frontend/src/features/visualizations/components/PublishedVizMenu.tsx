import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuItem from "@mui/material/MenuItem";
import {
  ArrowBendUpRight,
  LinkSimple,
  PresentationChart,
  Trash,
} from "@phosphor-icons/react";
import { useCallback } from "react";
import { useSnackbarActions } from "@/components/Snackbar/useSnackbarStore";
import { LinkMenuItem } from "@/features/navigation/components/Links";
import posthog from "@/posthog";
import { useHandleCopyClick } from "@/utils/useHandleCopyText";
import { useUpdateVisualization } from "../api/useVisualizations";

type Props = {
  visualizationID: string;
  closeMenu: () => void;
  onUnpublish?: () => void;
};

function PublishedVizMenu({ visualizationID, closeMenu, onUnpublish }: Props) {
  const handleCopyClick = useHandleCopyClick();
  const path = `/visualizations/${visualizationID}`;
  const { toastError } = useSnackbarActions();

  const handleCopy = useCallback(() => {
    handleCopyClick(`${window.location.origin}${path}`);
    closeMenu();
  }, [handleCopyClick, path, closeMenu]);

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
      <LinkMenuItem to={path} target="_blank" component="a" onClick={closeMenu}>
        <ListItemIcon>
          <PresentationChart size={24} />
        </ListItemIcon>
        See Public View
        <ListItemIcon sx={{ ml: 2 }}>
          <ArrowBendUpRight size={24} />
        </ListItemIcon>
      </LinkMenuItem>
      <MenuItem onClick={handleCopy}>
        <ListItemIcon>
          <LinkSimple height={24} width={24} />
        </ListItemIcon>
        Copy Link
      </MenuItem>
      <Divider />
      <MenuItem onClick={unPublishViz}>
        <ListItemIcon>
          <Trash height={24} width={24} />
        </ListItemIcon>
        Unpublish
      </MenuItem>
    </>
  );
}

export default PublishedVizMenu;
