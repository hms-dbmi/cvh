import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import type { components } from "../../../types/schema.d.ts";
import EntityListItem from "../../../components/EntityListItem.tsx";
import { ListItemProps } from "@mui/material/ListItem";
import EntityDates from "../../../components/EntityDates.tsx";

export default function VisualizationListItem({
  visualization,
  listItemProps,
}: {
  visualization: components["schemas"]["VisualizationNoConfOut"];
  listItemProps?: Partial<ListItemProps>;
}) {
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
        <Stack>
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
            <EntityDates
            created={visualization.created_timestamp}
            modified={visualization.modified_timestamp}
          />
          </Stack>
        </Stack>
      }
    />
  );
}
