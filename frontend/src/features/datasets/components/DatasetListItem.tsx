import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback } from "react";
import EntityDates from "../../../components/EntityDates.tsx";
import EntityListItem from "../../../components/EntityListItem.tsx";
import type { components } from "../../../types/schema.d.ts";

export default function DatasetListItem({
  dataset,
  selectItem,
  isSelected,
}: {
  dataset: components["schemas"]["DatasetOut"];
  projectId?: string;
  selectItem?: (id: string) => void;
  isSelected?: boolean;
}) {
  const handleSelectItem = useCallback(() => {
    if (selectItem && dataset.uuid) {
      selectItem(dataset.uuid);
    }
  }, [dataset.uuid, selectItem]);

  if (!dataset?.uuid) {
    return null;
  }

  return (
    <EntityListItem
      selectItem={selectItem ? handleSelectItem : undefined}
      isSelected={isSelected}
      primary={<Typography variant="subtitle1">{dataset.name}</Typography>}
      secondary={
        <Stack spacing={0.5}>
          <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
            {dataset.description}
          </Typography>
          <Stack direction="column">
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              Source:{" "}
              <Link href={dataset.source_url}>{dataset.source_url}</Link>
            </Typography>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              File Type: {dataset.file_type}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              Assay Type: {dataset.data_type}
            </Typography>
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
