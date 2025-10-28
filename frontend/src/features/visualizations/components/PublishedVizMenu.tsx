import { useCallback } from "react";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import { LinkMenuItem } from "../../navigation/components/Links";

import {
  PresentationChart,
  LinkSimple,
  Trash,
  ArrowBendUpRight,
} from "@phosphor-icons/react";
import { useHandleCopyClick } from "../../../utils/useHandleCopyText";
import { useUpdateVisualization } from "../api/useVisualizations";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";

type Props = {
  visualizationID: string;
};

function PublishedVizMenu({ visualizationID }: Props) {
  const handleCopyClick = useHandleCopyClick();
  const path = `/visualizations/${visualizationID}`;
  const { toastError } = useSnackbarActions();

  const handleCopy = useCallback(() => {
    handleCopyClick(`${window.location.origin}/${path}`);
  }, [handleCopyClick, path]);

  const { mutate: updateViz } = useUpdateVisualization();

  const unPublishViz = useCallback(() => {
    try {
      if (!visualizationID) {
        return;
      }
      updateViz({
        body: { published: false },
        params: {
          path: { visualization_uuid: visualizationID },
        },
      });
    } catch (e) {
      toastError("Error publishing visualization");
      console.error(e);
    }
  }, [updateViz, toastError, visualizationID]);

  return (
    <>
      <LinkMenuItem to={path} target="_blank" component="a">
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
