import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import PublishIcon from "@mui/icons-material/Publish";
import DeleteIcon from "@mui/icons-material/Delete";
import Chip from "@mui/material/Chip";

import type { components } from "../../../types/schema.d.ts";
import EntityListItem from "../../../components/EntityListItem.tsx";
import { ListItemProps } from "@mui/material/ListItem";
import EntityDates from "../../../components/EntityDates.tsx";
import { useCallback } from "react";
import TooltipIconButton from "../../../components/TooltipIconButton.tsx";
import {
  useDeleteVisualization,
  useUpdateVisualization,
} from "../api/useVisualizations.ts";
import AddVizTagButton from "./AddVizTagButton.tsx";
import { EditAttributes } from "@mui/icons-material";

type Visualization = components["schemas"]["VisualizationNoConfOut"];

export default function VisualizationListItem({
  visualization,
  listItemProps,
  openViz,
  editViz,
  showActions = false,
}: {
  visualization: Visualization;
  listItemProps?: Partial<ListItemProps>;
  showActions?: boolean;
  openViz?: (viz?: Visualization) => void;
  editViz?: (viz?: Visualization) => void;
}) {
  const handleEditViz = useCallback(() => {
    if (editViz && visualization?.uuid) {
      editViz(visualization);
    }
  }, [editViz, visualization]);

  const handleOpenViz = useCallback(() => {
    if (openViz && visualization) {
      openViz(visualization);
    }
  }, [openViz, visualization]);

  const { mutate: deleteViz } = useDeleteVisualization();

  const { mutate: updateViz } = useUpdateVisualization();

  const handleDeleteViz = useCallback(() => {
    if (visualization?.uuid) {
      deleteViz({
        params: {
          path: { visualization_uuid: visualization.uuid },
        },
      });
    }
  }, [deleteViz, visualization.uuid]);

  const handlePublishViz = useCallback(() => {
    if (visualization?.uuid) {
      updateViz({
        body: { published: true },
        params: {
          path: { visualization_uuid: visualization.uuid },
        },
      });
    }
  }, [updateViz, visualization.uuid]);

  if (!visualization?.uuid) {
    return null;
  }
  return (
    <EntityListItem
      listItemProps={listItemProps}
      primary={
        <Typography variant="subtitle1">{visualization.name}</Typography>
      }
      secondary={
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          <Stack>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              {visualization.description}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
                Source: {visualization.tool}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
                File Type: {visualization.tool_version}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" mt={1}>
              {visualization?.combined_tags?.map((tag) => (
                <Chip key={tag} label={tag} variant="outlined" />
              ))}
              {showActions && (
                <AddVizTagButton visualizationId={visualization.uuid} />
              )}
            </Stack>
            <EntityDates
              created={visualization.created_timestamp}
              modified={visualization.modified_timestamp}
            />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            {editViz && (
              <TooltipIconButton
                tooltip={`Edit ${visualization.tool} Visualization`}
                iconButtonProps={{
                  color: "primary",
                  size: "large",
                  onClick: handleEditViz,
                }}
              >
                <EditAttributes />
              </TooltipIconButton>
            )}
            <TooltipIconButton
              tooltip={`View ${visualization.tool} Visualization`}
              iconButtonProps={{
                color: "primary",
                size: "large",
                onClick: handleOpenViz,
              }}
            >
              <FullscreenIcon />
            </TooltipIconButton>
            {showActions && (
              <>
                <TooltipIconButton
                  tooltip="Publish Visualization"
                  iconButtonProps={{
                    disabled: visualization?.published,
                    color: "primary",
                    size: "large",
                    onClick: handlePublishViz,
                  }}
                >
                  <PublishIcon />
                </TooltipIconButton>
                <TooltipIconButton
                  tooltip="Delete Visualization"
                  iconButtonProps={{
                    color: "error",
                    size: "large",
                    onClick: handleDeleteViz,
                  }}
                >
                  <DeleteIcon />
                </TooltipIconButton>
              </>
            )}
          </Stack>
        </Stack>
      }
    />
  );
}
