import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";

import type { components } from "../../../types/schema.d.ts";
import EntityListItem from "../../../components/EntityListItem.tsx";

export default function DatasetListItem({
  dataset,
}: {
  dataset: components["schemas"]["DatasetOut"];
}) {
  if (!dataset?.uuid) {
    return null;
  }
  return (
    <EntityListItem
      primary={<Typography variant="subtitle1">{dataset.name}</Typography>}
      secondary={
        <Stack>
          <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
            {dataset.description}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              Source: <Link href={dataset.source_url}>{dataset.source_url}</Link>
            </Typography>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              File Type: {dataset.file_type}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              Data Type: {dataset.data_type}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={1}>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              Created: {dataset.created_timestamp}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              Modified: {dataset.modified_timestamp}
            </Typography>
          </Stack>
        </Stack>
      }
    />
  );
}
