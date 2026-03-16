import DeleteIcon from "@mui/icons-material/Delete";
import IconEdit from "@mui/icons-material/Edit";
import PublishIcon from "@mui/icons-material/Publish";
import IconEye from "@mui/icons-material/Visibility";
import type { ListItemProps } from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback } from "react";
import EntityDates from "../../../components/EntityDates.tsx";
import EntityListItem from "../../../components/EntityListItem.tsx";
import TooltipIconButton from "../../../components/TooltipIconButton.tsx";
import type { components } from "../../../types/schema.d.ts";
import {
  useDeleteVisualization,
  useUpdateVisualization,
} from "../api/useVisualizations.ts";

type Visualization = components["schemas"]["VisualizationSummaryOut"];

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
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              mt={1}
            ></Stack>
            <EntityDates
              created={visualization.created_timestamp}
              modified={visualization.modified_timestamp}
            />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            {editViz && (
              <TooltipIconButton
                tooltip="Edit Visualization"
                iconButtonProps={{
                  color: "primary",
                  size: "large",
                  onClick: handleEditViz,
                }}
              >
                <IconEdit />
              </TooltipIconButton>
            )}
            <TooltipIconButton
              tooltip="View  Visualization"
              iconButtonProps={{
                color: "primary",
                size: "large",
                onClick: handleOpenViz,
              }}
            >
              <IconEye />
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
