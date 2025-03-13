import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import Chip from "@mui/material/Chip";

import type { components } from "../../../types/schema.d.ts";
import EntityListItem from "../../../components/EntityListItem.tsx";
import AddTagButton from "./AddTagButton.tsx";
import EntityDates from "../../../components/EntityDates.tsx";

export default function DatasetListItem({
  dataset,
  projectId,
}: {
  dataset: components["schemas"]["DatasetOut"];
  projectId?: string;
}) {
  if (!dataset?.uuid) {
    return null;
  }
  return (
    <EntityListItem
      primary={<Typography variant="subtitle1">{dataset.name}</Typography>}
      secondary={
        <Stack spacing={0.5}>
          <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
            {dataset.description}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              Source:{" "}
              <Link href={dataset.source_url}>{dataset.source_url}</Link>
            </Typography>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              File Type: {dataset.file_type}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              Data Type: {dataset.data_type}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {dataset?.combined_tags?.map((tag) => (
              <Chip key={tag} label={tag} variant="outlined" />
            ))}
            <AddTagButton
              datasetId={dataset.uuid}
              projectId={projectId}
            />
          </Stack>
          <EntityDates
            created={dataset.created_timestamp}
            modified={dataset.modified_timestamp}
          />
        </Stack>
      }
    />
  );
}
